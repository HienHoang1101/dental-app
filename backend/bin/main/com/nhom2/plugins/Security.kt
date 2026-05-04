package com.nhom2.plugins

import com.nhom2.config.JwtConfig
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

fun Application.configureSecurity() {
    install(Authentication) {
<<<<<<< HEAD
        jwt {  // Default authentication (no name)
            verifier(
                com.auth0.jwt.JWT
                    .require(JwtConfig.algorithm)
                    .withIssuer(JwtConfig.getIssuer())
                    .withAudience(JwtConfig.getAudience())
                    .build()
            )
            validate { credential ->
                val userId = credential.payload.getClaim("userId")?.asString()
                if (userId != null) {
                    JWTPrincipal(credential.payload)
                } else null
            }
        }
        
        jwt("auth-jwt") {  // Named authentication (for backward compatibility)
=======
        jwt("auth-jwt") {
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
            verifier(
                com.auth0.jwt.JWT
                    .require(JwtConfig.algorithm)
                    .withIssuer(JwtConfig.getIssuer())
                    .withAudience(JwtConfig.getAudience())
                    .build()
            )
            validate { credential ->
                val userId = credential.payload.getClaim("userId")?.asString()
                if (userId != null) {
                    JWTPrincipal(credential.payload)
                } else null
            }
        }
    }
}