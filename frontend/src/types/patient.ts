export interface Patient {
  id: string
  userId: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  medicalHistory?: string
  allergies?: string
  currentMedications?: string
  createdAt: string
  updatedAt: string
}

export interface UpdatePatientRequest {
  name?: string
  phone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  medicalHistory?: string
  allergies?: string
  currentMedications?: string
}
