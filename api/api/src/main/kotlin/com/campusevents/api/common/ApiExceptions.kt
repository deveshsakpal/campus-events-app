package com.campusevents.api.common

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

open class ApiException(message: String, val status: HttpStatus) : RuntimeException(message)
class NotFoundException(message: String) : ApiException(message, HttpStatus.NOT_FOUND)
class ConflictException(message: String) : ApiException(message, HttpStatus.CONFLICT)
class UnauthorizedException(message: String) : ApiException(message, HttpStatus.UNAUTHORIZED)
class ForbiddenException(message: String) : ApiException(message, HttpStatus.FORBIDDEN)

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApiException(exception: ApiException) =
        ResponseEntity.status(exception.status).body(mapOf("message" to exception.message.orEmpty()))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(exception: MethodArgumentNotValidException): ResponseEntity<Map<String, String>> {
        val message = exception.bindingResult.fieldErrors.firstOrNull()
            ?.let { "${it.field}: ${it.defaultMessage ?: "is invalid"}" }
            ?: "The request contains invalid fields."
        return ResponseEntity.badRequest().body(mapOf("message" to message))
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableRequest() =
        ResponseEntity.badRequest().body(mapOf("message" to "The request body is missing or invalid."))
}
