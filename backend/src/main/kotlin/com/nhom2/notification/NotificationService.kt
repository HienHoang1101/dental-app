package com.nhom2.notification

import com.nhom2.common.*
import com.nhom2.models.Notifications
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

object NotificationService {
    
    fun createNotification(request: CreateNotificationRequest): NotificationDTO {
        return transaction {
            val id = Notifications.insert {
                it[userId] = UUID.fromString(request.userId)
                it[title] = request.title
                it[message] = request.message
                it[type] = request.type
                it[isRead] = false
                it[relatedId] = request.relatedId?.let { UUID.fromString(it) }
                it[createdAt] = Instant.now()
            } get Notifications.id

            getNotificationById(id)!!
        }
    }

    fun getNotificationById(id: UUID): NotificationDTO? {
        return transaction {
            Notifications.select { Notifications.id eq id }
                .map { it.toNotificationDTO() }
                .singleOrNull()
        }
    }

    fun getNotificationsByUser(userId: UUID, unreadOnly: Boolean = false): List<NotificationDTO> {
        return transaction {
            var query = Notifications.select { Notifications.userId eq userId }
            
            if (unreadOnly) {
                query = query.andWhere { Notifications.isRead eq false }
            }

            query.orderBy(Notifications.createdAt to SortOrder.DESC)
                .map { it.toNotificationDTO() }
        }
    }

    fun getUnreadCount(userId: UUID): Int {
        return transaction {
            Notifications.select {
                (Notifications.userId eq userId) and (Notifications.isRead eq false)
            }.count().toInt()
        }
    }

    fun markAsRead(id: UUID): Boolean {
        return transaction {
            Notifications.update({ Notifications.id eq id }) {
                it[isRead] = true
            } > 0
        }
    }

    fun markAllAsRead(userId: UUID): Int {
        return transaction {
            Notifications.update({ Notifications.userId eq userId }) {
                it[isRead] = true
            }
        }
    }

    fun deleteNotification(id: UUID): Boolean {
        return transaction {
            Notifications.deleteWhere { Notifications.id eq id } > 0
        }
    }

    private fun ResultRow.toNotificationDTO() = NotificationDTO(
        id = this[Notifications.id].toString(),
        userId = this[Notifications.userId].toString(),
        title = this[Notifications.title],
        message = this[Notifications.message],
        type = this[Notifications.type],
        isRead = this[Notifications.isRead],
        relatedId = this[Notifications.relatedId]?.toString(),
        createdAt = this[Notifications.createdAt].toString()
    )
}
