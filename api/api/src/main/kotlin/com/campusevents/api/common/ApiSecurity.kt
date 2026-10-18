package com.campusevents.api.common

import com.campusevents.api.users.User
import com.campusevents.api.users.UserRepository
import com.campusevents.api.users.UserRole
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.http.HttpMethod
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import org.springframework.web.filter.OncePerRequestFilter
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.Instant
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class UserPrincipal(val id: Long, val role: UserRole)

private const val PRINCIPAL_ATTRIBUTE = "campusEventsPrincipal"

fun HttpServletRequest.currentUser(): UserPrincipal =
    getAttribute(PRINCIPAL_ATTRIBUTE) as? UserPrincipal
        ?: throw UnauthorizedException("Please sign in to continue.")

@Component
class TokenService(
    @Value("\${app.jwt.secret}") secret: String,
    @Value("\${app.jwt.expiration-ms}") private val expirationMs: Long
) {
    private val key = secret.toByteArray(StandardCharsets.UTF_8)

    init {
        require(key.size >= 32) { "JWT_SECRET must contain at least 32 characters." }
    }

    fun createToken(userId: Long, role: UserRole): String {
        val header = Base64.getUrlEncoder().withoutPadding()
            .encodeToString("""{"alg":"HS256","typ":"JWT"}""".toByteArray())
        val payload = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(
                """{"sub":$userId,"role":"$role","exp":${Instant.now().epochSecond + expirationMs / 1000}}"""
                    .toByteArray()
            )
        val content = "$header.$payload"
        return "$content.${Base64.getUrlEncoder().withoutPadding().encodeToString(sign(content))}"
    }

    fun verify(token: String): UserPrincipal? {
        val parts = token.split('.')
        if (parts.size != 3) return null
        return try {
            val content = "${parts[0]}.${parts[1]}"
            val signature = Base64.getUrlDecoder().decode(parts[2])
            if (!MessageDigest.isEqual(sign(content), signature)) return null
            val payload = String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8)
            val userId = Regex(""""sub":(\d+)""").find(payload)?.groupValues?.get(1)?.toLong()
                ?: return null
            val role = Regex(""""role":"(STUDENT|TEACHER|ADMIN)"""").find(payload)
                ?.groupValues?.get(1)?.let(UserRole::valueOf) ?: return null
            val expiresAt = Regex(""""exp":(\d+)""").find(payload)?.groupValues?.get(1)?.toLong()
                ?: return null
            if (expiresAt <= Instant.now().epochSecond) return null
            UserPrincipal(userId, role)
        } catch (_: IllegalArgumentException) {
            null
        }
    }

    private fun sign(value: String): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(key, "HmacSHA256"))
        return mac.doFinal(value.toByteArray(StandardCharsets.UTF_8))
    }
}

@Component
class ApiAuthenticationFilter(private val tokenService: TokenService) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        if (request.method == HttpMethod.OPTIONS.name()) {
            filterChain.doFilter(request, response)
            return
        }

        val path = request.servletPath.takeIf { it.isNotBlank() } ?: request.requestURI
        val isPublic = (path.startsWith("/api/events") && request.method == HttpMethod.GET.name()) ||
            (path == "/api/health") ||
            (path == "/api/auth/signup" && request.method == HttpMethod.POST.name()) ||
            (path == "/api/auth/login" && request.method == HttpMethod.POST.name())

        if (isPublic) {
            // If token is provided, still set principal so endpoints can see who requested
            val token = request.getHeader("Authorization")
                ?.takeIf { it.startsWith("Bearer ", ignoreCase = true) }
                ?.substringAfter(' ')
            token?.let(tokenService::verify)?.let {
                request.setAttribute(PRINCIPAL_ATTRIBUTE, it)
            }
            filterChain.doFilter(request, response)
            return
        }

        val token = request.getHeader("Authorization")
            ?.takeIf { it.startsWith("Bearer ", ignoreCase = true) }
            ?.substringAfter(' ')
        val principal = token?.let(tokenService::verify)
        if (principal == null) {
            response.status = HttpServletResponse.SC_UNAUTHORIZED
            response.contentType = "application/json"
            response.writer.write("""{"message":"A valid bearer token is required."}""")
            return
        }

        // Admin-only management routes
        if (path.startsWith("/api/admin") && principal.role != UserRole.ADMIN) {
            response.status = HttpServletResponse.SC_FORBIDDEN
            response.contentType = "application/json"
            response.writer.write("""{"message":"Only admins can access admin management features."}""")
            return
        }

        // Event management routes (POST, PUT, DELETE) require ADMIN or TEACHER
        val isEventMutation = path.startsWith("/api/events") && (
            request.method == HttpMethod.POST.name() ||
            request.method == HttpMethod.PUT.name() ||
            request.method == HttpMethod.DELETE.name() ||
            request.method == HttpMethod.PATCH.name()
        )
        if (isEventMutation && principal.role != UserRole.ADMIN && principal.role != UserRole.TEACHER) {
            response.status = HttpServletResponse.SC_FORBIDDEN
            response.contentType = "application/json"
            response.writer.write("""{"message":"Only admins and teachers can manage events."}""")
            return
        }

        // Registration routes require STUDENT
        if (path.startsWith("/api/registrations") && principal.role != UserRole.STUDENT) {
            response.status = HttpServletResponse.SC_FORBIDDEN
            response.contentType = "application/json"
            response.writer.write("""{"message":"Only students can manage registrations."}""")
            return
        }

        request.setAttribute(PRINCIPAL_ATTRIBUTE, principal)
        filterChain.doFilter(request, response)
    }
}

@Configuration
class ApiConfiguration {
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun corsFilterRegistration(
        @Value("\${app.cors.allowed-origins}") allowedOrigins: String
    ): FilterRegistrationBean<CorsFilter> {
        val cors = CorsConfiguration().apply {
            this.allowedOrigins = allowedOrigins.split(',').map(String::trim).filter { it.isNotBlank() }
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            allowedHeaders = listOf("Authorization", "Content-Type", "Accept")
            allowCredentials = true
        }
        val source = UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/api/**", cors)
        }
        return FilterRegistrationBean(CorsFilter(source)).apply {
            order = Ordered.HIGHEST_PRECEDENCE
        }
    }

    @Bean
    fun adminBootstrap(
        userRepository: UserRepository,
        passwordEncoder: PasswordEncoder,
        @Value("\${ADMIN_EMAIL:}") configuredEmail: String,
        @Value("\${ADMIN_PASSWORD:}") configuredPassword: String,
        @Value("\${ADMIN_NAME:Campus Events Admin}") adminName: String
    ) = ApplicationRunner {
        if (configuredEmail.isBlank() && configuredPassword.isBlank()) return@ApplicationRunner
        require(configuredEmail.isNotBlank() && configuredPassword.length >= 8) {
            "Set both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters to bootstrap an admin."
        }
        val email = configuredEmail.trim().lowercase()
        val password = configuredPassword.trim()
        val existing = userRepository.findByEmail(email)
        if (existing == null) {
            userRepository.save(
                User(
                    email = email,
                    name = adminName.trim().ifBlank { "Campus Events Admin" },
                    passwordHash = requireNotNull(passwordEncoder.encode(password)),
                    role = UserRole.ADMIN
                )
            )
        } else {
            require(existing.role == UserRole.ADMIN) {
                "ADMIN_EMAIL is already assigned to a non-admin account."
            }
        }
    }
}
