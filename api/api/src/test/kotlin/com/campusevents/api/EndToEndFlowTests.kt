package com.campusevents.api

import com.campusevents.api.auth.LoginRequest
import com.campusevents.api.auth.SignUpRequest
import com.campusevents.api.common.ApiAuthenticationFilter
import com.campusevents.api.events.EventRequest
import com.campusevents.api.registrations.RegistrationRequest
import com.campusevents.api.users.CreateTeacherRequest
import com.campusevents.api.users.UserRepository
import com.campusevents.api.users.UserRole
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.DefaultMockMvcBuilder
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.WebApplicationContext
import tools.jackson.databind.ObjectMapper
import java.time.LocalDateTime

@SpringBootTest
class EndToEndFlowTests {

    @Autowired
    private lateinit var webApplicationContext: WebApplicationContext

    @Autowired
    private lateinit var apiAuthenticationFilter: ApiAuthenticationFilter

    @Autowired
    private lateinit var userRepository: UserRepository

    private lateinit var mockMvc: MockMvc

    private val objectMapper = ObjectMapper()

    @BeforeEach
    fun setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
            .addFilters<DefaultMockMvcBuilder>(apiAuthenticationFilter)
            .build()
    }

    @Test
    fun testCompleteMultiRoleFlow() {
        val uniqueSuffix = System.currentTimeMillis()

        // 1. Create an admin user directly or verify bootstrap
        val adminEmail = "admin_$uniqueSuffix@campus.test"
        mockMvc.perform(
            post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        SignUpRequest("Admin Candidate", adminEmail, "adminPass123")
                    )
                )
        ).andExpect(status().isCreated)

        // Upgrade user to ADMIN in DB for testing
        val adminUser = userRepository.findByEmail(adminEmail)!!
        adminUser.role = UserRole.ADMIN
        userRepository.save(adminUser)

        // 2. Login as Admin
        val adminLoginResponse = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        LoginRequest(adminEmail, "adminPass123")
                    )
                )
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.role").value("ADMIN"))
            .andReturn()

        val adminToken = objectMapper.readTree(adminLoginResponse.response.contentAsString)
            .get("token").asText()
        assertNotNull(adminToken)

        // 3. Admin creates Teacher 1 and Teacher 2
        val teacher1Email = "teacher1_$uniqueSuffix@campus.test"
        val teacher1Response = mockMvc.perform(
            post("/api/admin/teachers")
                .header("Authorization", "Bearer $adminToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        CreateTeacherRequest("Prof. Alice", teacher1Email, "teacherPass123")
                    )
                )
        ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.role").value("TEACHER"))
            .andReturn()

        val teacher1Id = objectMapper.readTree(teacher1Response.response.contentAsString)
            .get("id").asLong()

        val teacher2Email = "teacher2_$uniqueSuffix@campus.test"
        mockMvc.perform(
            post("/api/admin/teachers")
                .header("Authorization", "Bearer $adminToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        CreateTeacherRequest("Prof. Bob", teacher2Email, "teacherPass456")
                    )
                )
        ).andExpect(status().isCreated)

        // Verify teachers list
        mockMvc.perform(
            get("/api/admin/teachers")
                .header("Authorization", "Bearer $adminToken")
        ).andExpect(status().isOk)

        // 4. Login as Teacher 1
        val teacher1LoginResponse = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        LoginRequest(teacher1Email, "teacherPass123")
                    )
                )
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.role").value("TEACHER"))
            .andReturn()

        val teacher1Token = objectMapper.readTree(teacher1LoginResponse.response.contentAsString)
            .get("token").asText()

        // 5. Login as Teacher 2
        val teacher2LoginResponse = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        LoginRequest(teacher2Email, "teacherPass456")
                    )
                )
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.role").value("TEACHER"))
            .andReturn()

        val teacher2Token = objectMapper.readTree(teacher2LoginResponse.response.contentAsString)
            .get("token").asText()

        // 6. Teacher 1 creates an event
        val eventCreateResponse = mockMvc.perform(
            post("/api/events")
                .header("Authorization", "Bearer $teacher1Token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        EventRequest(
                            title = "AI in Healthcare Workshop",
                            description = "Introduction to modern healthcare models.",
                            venue = "Engineering Hall 101",
                            eventDate = LocalDateTime.now().plusDays(7)
                        )
                    )
                )
        ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.createdById").value(teacher1Id))
            .andReturn()

        val eventId = objectMapper.readTree(eventCreateResponse.response.contentAsString)
            .get("id").asLong()

        // 7. Teacher 2 attempts to edit Teacher 1's event -> 403 Forbidden!
        mockMvc.perform(
            put("/api/events/$eventId")
                .header("Authorization", "Bearer $teacher2Token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        EventRequest(
                            title = "Hijacked Event Title",
                            description = "Attempting unauthorized edit.",
                            venue = "Room 999",
                            eventDate = LocalDateTime.now().plusDays(10)
                        )
                    )
                )
        ).andExpect(status().isForbidden)

        // 8. Teacher 1 edits their own event -> succeeds
        mockMvc.perform(
            put("/api/events/$eventId")
                .header("Authorization", "Bearer $teacher1Token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        EventRequest(
                            title = "AI in Healthcare Workshop (Updated)",
                            description = "Introduction to modern healthcare models and hands-on lab.",
                            venue = "Engineering Hall 101",
                            eventDate = LocalDateTime.now().plusDays(7)
                        )
                    )
                )
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.title").value("AI in Healthcare Workshop (Updated)"))

        // 9. Student signs up
        val studentEmail = "student_$uniqueSuffix@campus.test"
        val studentSignUpResponse = mockMvc.perform(
            post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        SignUpRequest("Jane Student", studentEmail, "studentPass123")
                    )
                )
        ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.role").value("STUDENT"))
            .andReturn()

        val studentToken = objectMapper.readTree(studentSignUpResponse.response.contentAsString)
            .get("token").asText()

        // 10. Student attempts to create an event -> 403 Forbidden!
        mockMvc.perform(
            post("/api/events")
                .header("Authorization", "Bearer $studentToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        EventRequest(
                            title = "Student Party",
                            description = "Unauthorized event creation.",
                            venue = "Dorm",
                            eventDate = LocalDateTime.now().plusDays(1)
                        )
                    )
                )
        ).andExpect(status().isForbidden)

        // 11. Student registers for the event
        mockMvc.perform(
            post("/api/registrations")
                .header("Authorization", "Bearer $studentToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        RegistrationRequest(eventId)
                    )
                )
        ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.eventId").value(eventId))

        // 12. Student attempts duplicate registration -> 409 Conflict!
        mockMvc.perform(
            post("/api/registrations")
                .header("Authorization", "Bearer $studentToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        RegistrationRequest(eventId)
                    )
                )
        ).andExpect(status().isConflict)

        // 13. Student checks my registrations
        mockMvc.perform(
            get("/api/registrations")
                .header("Authorization", "Bearer $studentToken")
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$[0].eventId").value(eventId))

        // 14. Admin has global power: Admin can edit the event
        mockMvc.perform(
            put("/api/events/$eventId")
                .header("Authorization", "Bearer $adminToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        EventRequest(
                            title = "AI in Healthcare Workshop (Admin Revised)",
                            description = "Verified by administration.",
                            venue = "Auditorium Main",
                            eventDate = LocalDateTime.now().plusDays(7)
                        )
                    )
                )
        ).andExpect(status().isOk)

        // 15. Admin deletes the event (cleans up registrations automatically)
        mockMvc.perform(
            delete("/api/events/$eventId")
                .header("Authorization", "Bearer $adminToken")
        ).andExpect(status().isNoContent)

        // Verify event is deleted
        mockMvc.perform(
            get("/api/events/$eventId")
        ).andExpect(status().isNotFound)
    }
}
