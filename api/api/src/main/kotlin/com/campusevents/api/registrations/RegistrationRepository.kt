package com.campusevents.api.registrations

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.transaction.annotation.Transactional

interface RegistrationRepository : JpaRepository<Registration, Long> {
    fun findAllByStudentIdOrderByRegisteredAtDesc(studentId: Long): List<Registration>
    fun existsByStudentIdAndEventId(studentId: Long, eventId: Long): Boolean

    @Modifying
    @Transactional
    fun deleteAllByEventId(eventId: Long)
}
