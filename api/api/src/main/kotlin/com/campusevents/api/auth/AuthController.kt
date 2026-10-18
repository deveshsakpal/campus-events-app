package com.campusevents.api.auth

import com.campusevents.api.common.ConflictException
import com.campusevents.api.common.TokenService
import com.campusevents.api.common.UnauthorizedException
import com.campusevents.api.common.currentUser
import com.campusevents.api.users.User
import com.campusevents.api.users.UserRepository
import com.campusevents.api.users.UserRole
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.Locale

data class SignUpRequest(
    @field:NotBlank @field:Size(max = 100) val name: String,
    @field:Email @field:NotBlank @field:Size(max = 254) val email: String,
    @field:Size(min = 8, max = 72) val password: String
)

data class LoginRequest(
    @field:Email @field:NotBlank @field:Size(max = 254) val email: String,
    @field:NotBlank @field:Size(max = 72) val password: String
)

data class AuthResponse(
    val token: String,
    val id: Long,
    val name: String,
    val email: String,
    val role: UserRole
)

data class UserProfileResponse(
    val id: Long,
    val name: String,
    val email: String,
    val role: UserRole
)

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val tokenService: TokenService
) {
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    fun signUp(@Valid @RequestBody request: SignUpRequest): AuthResponse {
        val email = request.email.trim().lowercase(Locale.ROOT)
        if (userRepository.findByEmail(email) != null) {
            throw ConflictException("An account with this email already exists.")
        }
        val user = try {
            userRepository.saveAndFlush(
                User(
                    name = request.name.trim(),
                    email = email,
                    passwordHash = requireNotNull(passwordEncoder.encode(request.password)),
                    role = UserRole.STUDENT
                )
            )
        } catch (exception: DataIntegrityViolationException) {
            throw ConflictException("An account with this email already exists.")
        }
        return user.toAuthResponse()
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): AuthResponse {
        val user = userRepository.findByEmail(request.email.trim().lowercase(Locale.ROOT))
            ?: throw UnauthorizedException("Email or password is incorrect.")
        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw UnauthorizedException("Email or password is incorrect.")
        }
        return user.toAuthResponse()
    }

    @GetMapping("/me")
    fun me(request: HttpServletRequest): UserProfileResponse {
        val principal = request.currentUser()
        val user = userRepository.findById(principal.id).orElseThrow {
            UnauthorizedException("User account no longer exists.")
        }
        return UserProfileResponse(
            id = requireNotNull(user.id),
            name = user.name,
            email = user.email,
            role = user.role
        )
    }

    private fun User.toAuthResponse() = AuthResponse(
        token = tokenService.createToken(requireNotNull(id), role),
        id = requireNotNull(id),
        name = name,
        email = email,
        role = role
    )
}
