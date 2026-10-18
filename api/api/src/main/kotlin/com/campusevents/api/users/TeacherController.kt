package com.campusevents.api.users

import com.campusevents.api.common.ConflictException
import com.campusevents.api.common.NotFoundException
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.Locale

data class CreateTeacherRequest(
    @field:NotBlank @field:Size(max = 100) val name: String,
    @field:Email @field:NotBlank @field:Size(max = 254) val email: String,
    @field:NotBlank @field:Size(min = 8, max = 72) val password: String
)

data class TeacherResponse(
    val id: Long,
    val name: String,
    val email: String,
    val role: UserRole
)

@RestController
@RequestMapping("/api/admin/teachers")
class TeacherController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    @GetMapping
    fun listTeachers(): List<TeacherResponse> =
        userRepository.findAllByRole(UserRole.TEACHER).map { it.toResponse() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createTeacher(@Valid @RequestBody request: CreateTeacherRequest): TeacherResponse {
        val email = request.email.trim().lowercase(Locale.ROOT)
        if (userRepository.findByEmail(email) != null) {
            throw ConflictException("An account with this email already exists.")
        }
        val teacher = userRepository.save(
            User(
                name = request.name.trim(),
                email = email,
                passwordHash = requireNotNull(passwordEncoder.encode(request.password)),
                role = UserRole.TEACHER
            )
        )
        return teacher.toResponse()
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteTeacher(@PathVariable id: Long) {
        val teacher = userRepository.findById(id).orElseThrow {
            NotFoundException("Teacher not found.")
        }
        if (teacher.role != UserRole.TEACHER) {
            throw NotFoundException("User is not a teacher.")
        }
        userRepository.delete(teacher)
    }

    private fun User.toResponse() = TeacherResponse(
        id = requireNotNull(id),
        name = name,
        email = email,
        role = role
    )
}
