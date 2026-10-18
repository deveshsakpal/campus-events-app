package com.campusevents.api.registrations

import com.campusevents.api.common.ConflictException
import com.campusevents.api.common.NotFoundException
import com.campusevents.api.common.currentUser
import com.campusevents.api.events.EventRepository
import com.campusevents.api.users.UserRepository
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

data class RegistrationRequest(@field:NotNull val eventId: Long)

data class RegistrationResponse(
    val id: Long,
    val eventId: Long,
    val eventTitle: String,
    val eventVenue: String,
    val eventDate: LocalDateTime,
    val registeredAt: LocalDateTime
)

@RestController
@RequestMapping("/api/registrations")
class RegistrationController(
    private val registrationRepository: RegistrationRepository,
    private val eventRepository: EventRepository,
    private val userRepository: UserRepository
) {
    @GetMapping
    fun getMyRegistrations(request: HttpServletRequest): List<RegistrationResponse> {
        val studentId = request.currentUser().id
        return registrationRepository.findAllByStudentIdOrderByRegisteredAtDesc(studentId)
            .map { it.toResponse() }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun register(
        @Valid @RequestBody request: RegistrationRequest,
        httpRequest: HttpServletRequest
    ): RegistrationResponse {
        val studentId = httpRequest.currentUser().id
        val student = userRepository.findById(studentId)
            .orElseThrow { NotFoundException("Student account not found.") }
        val event = eventRepository.findById(request.eventId)
            .orElseThrow { NotFoundException("Event not found.") }

        if (registrationRepository.existsByStudentIdAndEventId(student.id!!, event.id!!)) {
            throw ConflictException("You are already registered for this event.")
        }

        return try {
            registrationRepository.saveAndFlush(Registration(student = student, event = event))
                .toResponse()
        } catch (exception: DataIntegrityViolationException) {
            if (registrationRepository.existsByStudentIdAndEventId(student.id!!, event.id!!)) {
                throw ConflictException("You are already registered for this event.")
            }
            throw exception
        }
    }

    private fun Registration.toResponse() = RegistrationResponse(
        id = requireNotNull(id),
        eventId = requireNotNull(event.id),
        eventTitle = event.title,
        eventVenue = event.venue,
        eventDate = event.eventDate,
        registeredAt = registeredAt
    )
}
