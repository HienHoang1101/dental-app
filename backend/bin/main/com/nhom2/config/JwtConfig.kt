package com.nhom2.config

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.github.cdimascio.dotenv.dotenv
import java.util.*

object JwtConfig {
    private val env = dotenv { ignoreIfMissing = true }
    private val secret = env["JWT_SECRET"] ?: "default_secret_change_me"
    private const val issuer = "nhakhoaapp"
    private const val audience = "nhakhoaapp-users"
    private const val expirationDays = 1L

    val algorithm: Algorithm = Algorithm.HMAC256(secret)

    fun generateToken(userId: UUID, role: String): String {
        return JWT.create()
            .withIssuer(issuer)
            .withAudience(audience)
            .withClaim("userId", userId.toString())
            .withClaim("role", role)
            .withExpiresAt(Date(System.currentTimeMillis() + expirationDays * 24 * 60 * 60 * 1000))
            .sign(algorithm)
    }

    fun getIssuer() = issuer
    fun getAudience() = audience
}