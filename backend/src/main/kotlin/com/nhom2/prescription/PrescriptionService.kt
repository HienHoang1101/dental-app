package com.nhom2.prescription

import com.nhom2.common.*
import com.nhom2.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.*

object PrescriptionService {
    // Medication management
    fun getAllMedications(activeOnly: Boolean = false): List<MedicationDTO> = transaction {
        val query = if (activeOnly) Medications.select { Medications.isActive eq true } else Medications.selectAll()
        query.orderBy(Medications.name to SortOrder.ASC).map { rowToMedicationDTO(it) }
    }

    fun getMedicationById(id: UUID): MedicationDTO? = transaction {
        Medications.select { Medications.id eq id }.map { rowToMedicationDTO(it) }.singleOrNull()
    }

    fun createMedication(request: CreateMedicationRequest): MedicationDTO = transaction {
        val id = Medications.insert {
            it[name] = request.name
            it[unit] = request.unit
            it[price] = request.price
            it[description] = request.description
            it[defaultDosage] = request.defaultDosage
            it[isActive] = true
            it[createdAt] = Instant.now()
            it[updatedAt] = Instant.now()
        } get Medications.id
        getMedicationById(id)!!
    }

    fun updateMedication(id: UUID, request: UpdateMedicationRequest): MedicationDTO? = transaction {
        val exists = Medications.select { Medications.id eq id }.count() > 0
        if (!exists) return@transaction null

        Medications.update({ Medications.id eq id }) {
            request.name?.let { n -> it[name] = n }
            request.unit?.let { u -> it[unit] = u }
            request.price?.let { p -> it[price] = p }
            request.description?.let { d -> it[description] = d }
            request.defaultDosage?.let { dd -> it[defaultDosage] = dd }
            request.isActive?.let { a -> it[isActive] = a }
            it[updatedAt] = Instant.now()
        }
        getMedicationById(id)
    }

    fun deleteMedication(id: UUID): Boolean = transaction {
        Medications.deleteWhere { Medications.id eq id } > 0
    }

    // Prescription management
    fun createPrescription(request: CreatePrescriptionRequest, doctorId: UUID): PrescriptionDTO = transaction {
        val prescriptionId = Prescriptions.insert {
            it[appointmentId] = request.appointmentId?.let { id -> UUID.fromString(id) }
            it[patientId] = UUID.fromString(request.patientId)
            it[this.doctorId] = doctorId
            it[diagnosis] = request.diagnosis
            it[advice] = request.advice
            it[followUpDate] = request.followUpDate?.let { date -> java.time.LocalDate.parse(date) }
            it[createdAt] = Instant.now()
        } get Prescriptions.id

        request.items.forEach { item ->
            val medicationId = UUID.fromString(item.medicationId)
            val medicationPrice = Medications.select { Medications.id eq medicationId }
                .singleOrNull()
                ?.get(Medications.price)
                ?: throw IllegalArgumentException("Medication not found: ${item.medicationId}")

            PrescriptionItems.insert {
                it[this.prescriptionId] = prescriptionId
                it[this.medicationId] = medicationId
                it[quantity] = item.quantity
                it[unitPrice] = medicationPrice
                it[dosageInstruction] = item.dosageInstruction
                it[createdAt] = Instant.now()
            }
        }

        getPrescriptionById(prescriptionId)!!
    }

    fun getPrescriptionById(id: UUID): PrescriptionDTO? = transaction {
        Prescriptions.join(Users, JoinType.INNER, Prescriptions.patientId, Users.id)
            .join(SupabaseDoctors, JoinType.INNER, Prescriptions.doctorId, SupabaseDoctors.id)
            .select { Prescriptions.id eq id }
            .map { row ->
                val items = PrescriptionItems.join(Medications, JoinType.INNER, PrescriptionItems.medicationId, Medications.id)
                    .select { PrescriptionItems.prescriptionId eq id }
                    .map { itemRow ->
                        val quantity = itemRow[PrescriptionItems.quantity]
                        val unitPrice = itemRow[PrescriptionItems.unitPrice].takeIf { it > 0 }
                            ?: itemRow[Medications.price]
                        PrescriptionItemDTO(
                            id = itemRow[PrescriptionItems.id].toString(),
                            medicationId = itemRow[Medications.id].toString(),
                            medicationName = itemRow[Medications.name],
                            unit = itemRow[Medications.unit],
                            quantity = quantity,
                            unitPrice = unitPrice,
                            totalPrice = unitPrice * quantity,
                            dosageInstruction = itemRow[PrescriptionItems.dosageInstruction]
                        )
                    }
                val appointmentId = row[Prescriptions.appointmentId]
                val appointmentService = appointmentId?.let { apptId ->
                    Appointments.leftJoin(Services, { Appointments.serviceId }, { Services.id })
                        .select { Appointments.id eq apptId }
                        .singleOrNull()
                }
                val serviceName = appointmentService?.getOrNull(Services.name)
                val servicePrice = appointmentService?.getOrNull(Services.price) ?: 0
                val totalMedicationPrice = items.sumOf { it.totalPrice }

                PrescriptionDTO(
                    id = row[Prescriptions.id].toString(),
                    appointmentId = appointmentId?.toString(),
                    patientId = row[Prescriptions.patientId].toString(),
                    patientName = row[Users.fullName],
                    doctorId = row[Prescriptions.doctorId].toString(),
                    doctorName = row[SupabaseDoctors.fullName],
                    diagnosis = row[Prescriptions.diagnosis],
                    advice = row[Prescriptions.advice],
                    followUpDate = row[Prescriptions.followUpDate]?.toString(),
                    serviceName = serviceName,
                    servicePrice = servicePrice,
                    items = items,
                    totalMedicationPrice = totalMedicationPrice,
                    totalAmount = servicePrice + totalMedicationPrice,
                    createdAt = row[Prescriptions.createdAt].toString()
                )
            }.singleOrNull()
    }

    fun getPrescriptionByAppointmentId(appointmentId: UUID): PrescriptionDTO? = transaction {
        val id = Prescriptions.select { Prescriptions.appointmentId eq appointmentId }
            .map { it[Prescriptions.id] }
            .singleOrNull() ?: return@transaction null
        getPrescriptionById(id)
    }

    fun getAllPrescriptions(): List<PrescriptionDTO> = transaction {
        Prescriptions.selectAll()
            .orderBy(Prescriptions.createdAt to SortOrder.DESC)
            .map { row -> getPrescriptionById(row[Prescriptions.id])!! }
    }

    private fun rowToMedicationDTO(row: ResultRow) = MedicationDTO(
        id = row[Medications.id].toString(),
        name = row[Medications.name],
        unit = row[Medications.unit],
        price = row[Medications.price],
        description = row[Medications.description],
        defaultDosage = row[Medications.defaultDosage],
        isActive = row[Medications.isActive],
        createdAt = row[Medications.createdAt].toString(),
        updatedAt = row[Medications.updatedAt].toString()
    )
}
