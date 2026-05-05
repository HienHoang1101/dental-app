package com.nhom2.dashboard

import com.nhom2.common.*
import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDate

object DashboardService {
    
    fun getDashboardStats(startDate: LocalDate? = null, endDate: LocalDate? = null): DashboardStatsDTO {
        return transaction {
            val start = startDate ?: LocalDate.now().withDayOfMonth(1)
            val end = endDate ?: LocalDate.now()

            // Total appointments in date range
            val totalAppointments = Appointments.select {
                (Appointments.appointmentDate greaterEq start) and
                (Appointments.appointmentDate lessEq end)
            }.count().toInt()

            // Total patients (unique users with patient role)
            val totalPatients = Users.select { Users.role eq "patient" }.count().toInt()

            // Total revenue from completed appointments
            val revenue = calculateRevenue(start, end)

            // Appointments by status
            val appointmentsByStatus = mapOf(
                "pending" to Appointments.select {
                    (Appointments.status eq "pending") and
                    (Appointments.appointmentDate greaterEq start) and
                    (Appointments.appointmentDate lessEq end)
                }.count().toInt(),
                "confirmed" to Appointments.select {
                    (Appointments.status eq "confirmed") and
                    (Appointments.appointmentDate greaterEq start) and
                    (Appointments.appointmentDate lessEq end)
                }.count().toInt(),
                "completed" to Appointments.select {
                    (Appointments.status eq "completed") and
                    (Appointments.appointmentDate greaterEq start) and
                    (Appointments.appointmentDate lessEq end)
                }.count().toInt(),
                "cancelled" to Appointments.select {
                    (Appointments.status eq "cancelled") and
                    (Appointments.appointmentDate greaterEq start) and
                    (Appointments.appointmentDate lessEq end)
                }.count().toInt()
            )

            // Recent appointments
            val recentAppointments = Appointments.selectAll()
                .orderBy(Appointments.createdAt to SortOrder.DESC)
                .limit(10)
                .map { it.toAppointmentSummaryDTO() }

            DashboardStatsDTO(
                totalAppointments = totalAppointments,
                totalPatients = totalPatients,
                totalRevenue = revenue.toString(),
                appointmentsByStatus = appointmentsByStatus,
                recentAppointments = recentAppointments
            )
        }
    }

    private fun calculateRevenue(startDate: LocalDate, endDate: LocalDate): Int {
        return transaction {
            val appointments = (Appointments innerJoin Services).select {
                (Appointments.status eq "completed") and
                (Appointments.appointmentDate greaterEq startDate) and
                (Appointments.appointmentDate lessEq endDate) and
                (Appointments.serviceId.isNotNull())
            }

            appointments.fold(0) { acc, row ->
                acc + row[Services.price]
            }
        }
    }

    private fun ResultRow.toAppointmentSummaryDTO(): AppointmentSummaryDTO {
        val patientId = this[Appointments.patientId]
        val doctorId = this[Appointments.doctorId]
        val timeSlotId = this[Appointments.timeSlotId]
        val serviceId = this[Appointments.serviceId]

        val patient = Users.select { Users.id eq patientId }.single()
        val doctor = SupabaseDoctors.select { SupabaseDoctors.id eq doctorId }.single()
        val timeSlot = TimeSlots.select { TimeSlots.id eq timeSlotId }.single()
        val service = serviceId?.let { Services.select { Services.id eq it }.singleOrNull() }

        return AppointmentSummaryDTO(
            id = this[Appointments.id].toString(),
            patientName = patient[Users.fullName],
            doctorName = doctor[SupabaseDoctors.fullName],
            specialtyName = doctor[SupabaseDoctors.specialty],
            appointmentDate = this[Appointments.appointmentDate].toString(),
            startTime = timeSlot[TimeSlots.startTime].toString(),
            endTime = timeSlot[TimeSlots.endTime].toString(),
            status = this[Appointments.status],
            serviceName = service?.get(Services.name)
        )
    }
}
