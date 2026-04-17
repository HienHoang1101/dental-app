package com.nhom2.utils

import at.favre.lib.crypto.bcrypt.BCrypt

object PasswordHasher {

    // Hash password với cost factor 12 (theo SRS: NF-SEC-01)
    fun hash(password: String): String {
        return BCrypt.withDefaults().hashToString(12, password.toCharArray())
    }

    // So sánh password người dùng nhập với hash trong DB
    fun verify(password: String, hash: String): Boolean {
        return BCrypt.verifyer().verify(password.toCharArray(), hash).verified
    }
}

