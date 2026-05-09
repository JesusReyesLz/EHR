import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  try {
    const email = "pruebkey77@gmail.com";
    const password = "Password123!"; // Default password
    
    // 1. Create Super Admin User in Firebase Auth or Login
    let uid;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
      console.log("Auth user created.");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log("Auth user already exists. Logging in...");
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const loginCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = loginCredential.user.uid;
      } else {
        throw error;
      }
    }

    // Now we are authenticated as the super admin.
    
    // 2. Create Clinic
    const clinicId = "CLINIC_DEFAULT";
    const clinicRef = doc(db, 'clinics', clinicId);
    
    // We can just setDoc directly, if it exists it will overwrite/update
    await setDoc(clinicRef, {
      name: "Clínica Principal",
      address: "Calle Principal 123",
      phone: "555-0123",
      email: "contacto@clinica.com",
      activeModules: ["Pacientes", "Consulta", "Inventario", "Caja", "Reportes", "Configuración", "Super Admin"],
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log("Clinic created or updated.");

    // 3. Create User Document in Firestore
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email: email,
      name: "Super Administrador",
      roleId: "SUPER_ADMIN",
      clinicId: clinicId,
      isActive: true,
      customModules: []
    }, { merge: true });
    console.log("User document created or updated.");

    console.log("Seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
