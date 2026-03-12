import { adminAuth, adminDb } from "@/lib/firebase/admin"
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Handle Bulk Creation
    if (Array.isArray(data)) {
      const results = await Promise.all(data.map(async (userData) => {
        const { name, email, registrationNumber, password, role } = userData
        
        // Derive email if only reg number is provided
        const finalEmail = email || `${registrationNumber}@reg.online.test`.toLowerCase()
        
        try {
          const userRecord = await adminAuth.createUser({
            email: finalEmail,
            password,
            displayName: name,
          })

          await adminDb.collection("profiles").doc(userRecord.uid).set({
            name,
            email: finalEmail,
            registrationNumber: registrationNumber || "",
            role: role || 'student',
            createdAt: new Date(),
          })
          return { email: finalEmail, success: true }
        } catch (err: any) {
          return { email: finalEmail, success: false, error: err.message }
        }
      }))
      return NextResponse.json({ results })
    }

    // Handle Single Creation
    const { name, email, registrationNumber, password, role } = data
    const finalEmail = email || `${registrationNumber}@reg.online.test`.toLowerCase()
    
    const userRecord = await adminAuth.createUser({
      email: finalEmail,
      password,
      displayName: name,
    })

    await adminDb.collection("profiles").doc(userRecord.uid).set({
      name,
      email: finalEmail,
      registrationNumber: registrationNumber || "",
      role: role || 'student',
      createdAt: new Date(),
    })

    return NextResponse.json({ user: userRecord })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error("ID is required")

    // 1. Delete from Firebase Auth
    await adminAuth.deleteUser(id)

    // 2. Delete profile from Firestore
    await adminDb.collection("profiles").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
