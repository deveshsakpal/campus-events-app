package com.campusevents.api.events

import com.campusevents.api.common.ForbiddenException
import com.campusevents.api.common.NotFoundException
import com.campusevents.api.common.currentUser
import com.campusevents.api.registrations.RegistrationRepository
import com.campusevents.api.users.UserRepository
import com.campusevents.api.users.UserRole
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

data class EventRequest(
    @field:NotBlank @field:Size(max = 160) val title: String,
    @field:NotBlank @field:Size(max = 2000) val description: String,
    @field:NotBlank @field:Size(max = 200) val venue: String,
    @field:NotNull val eventDate: LocalDateTime
)

data class EventResponse(
    val id: Long,
    val title: String,
    val description: String,
    val venue: String,
    val eventDate: LocalDateTime,
    val createdById: Long?,
    val createdByName: String?
)

@RestController
@RequestMapping("/api/events")
class EventController(
    private val repository: EventRepository,
    private val userRepository: UserRepository,
    private val registrationRepository: RegistrationRepository
) {
    @GetMapping
    fun getEvents(): List<EventResponse> =
        repository.findAll().sortedBy { it.eventDate }.map { it.toResponse() }

    @GetMapping("/{id}")
    fun getEvent(@PathVariable id: Long): EventResponse {
        val event = repository.findById(id).orElseThrow { NotFoundException("Event not found.") }
        return event.toResponse()
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createEvent(
        @Valid @RequestBody request: EventRequest,
        httpRequest: HttpServletRequest
    ): EventResponse {
        val principal = httpRequest.currentUser()
        val user = userRepository.findById(principal.id)
            .orElseThrow { NotFoundException("User not found.") }

        val event = Event(
            title = request.title.trim(),
            description = request.description.trim(),
            venue = request.venue.trim(),
            eventDate = request.eventDate,
            createdBy = user
        )
        return repository.save(event).toResponse()
    }

    @PutMapping("/{id}")
    fun updateEvent(
        @PathVariable id: Long,
        @Valid @RequestBody request: EventRequest,
        httpRequest: HttpServletRequest
    ): EventResponse {
        val principal = httpRequest.currentUser()
        val event = repository.findById(id).orElseThrow { NotFoundException("Event not found.") }

        // Role check: Admin can update any event. Teacher can only update their own event.
        if (principal.role == UserRole.TEACHER) {
            if (event.createdBy?.id != principal.id) {
                throw ForbiddenException("Teachers can only edit events they created.")
            }
        }

        event.title = request.title.trim()
        event.description = request.description.trim()
        event.venue = request.venue.trim()
        event.eventDate = request.eventDate
        return repository.save(event).toResponse()
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteEvent(
        @PathVariable id: Long,
        httpRequest: HttpServletRequest
    ) {
        val principal = httpRequest.currentUser()
        val event = repository.findById(id).orElseThrow { NotFoundException("Event not found.") }

        // Role check: Admin can delete any event. Teacher can only delete their own event.
        if (principal.role == UserRole.TEACHER) {
            if (event.createdBy?.id != principal.id) {
                throw ForbiddenException("Teachers can only delete events they created.")
            }
        }

        registrationRepository.deleteAllByEventId(id)
        repository.delete(event)
    }

    private fun Event.toResponse() = EventResponse(
        id = requireNotNull(id),
        title = title,
        description = description,
        venue = venue,
        eventDate = eventDate,
        createdById = createdBy?.id,
        createdByName = createdBy?.name
    )
}
