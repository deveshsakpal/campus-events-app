package com.campusevents.api.users

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

enum class UserRole { STUDENT, TEACHER, ADMIN }

@Entity
@Table(name = "app_users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false, unique = true, length = 254)
    var email: String = "",

    @Column(nullable = false)
    var passwordHash: String = "",

    @Column(nullable = false, length = 100)
    var name: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var role: UserRole = UserRole.STUDENT
)
