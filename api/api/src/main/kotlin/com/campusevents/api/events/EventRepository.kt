package com.campusevents.api.events

import org.springframework.data.jpa.repository.JpaRepository

interface EventRepository : JpaRepository<Event, Long> {
    fun findAllByCreatedById(createdById: Long): List<Event>
}
