import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firestore = inject(Firestore);  // Inyectamos Firestore
  private router = inject(Router);        // Inyectamos Router

  private _authStateSubject = new BehaviorSubject<any>(null);  // Estado de la sesión del usuario
  authState$ = this._authStateSubject.asObservable(); // Observable del estado de la sesión

  constructor() {
    this.initializeAuthState();
  }

  // Inicializar el estado de autenticación
  initializeAuthState() {
    // Este método solo establecería el estado del usuario cuando se recargue la página
    const user = localStorage.getItem('user');
    if (user) {
      this._authStateSubject.next(JSON.parse(user));
    } else {
      this._authStateSubject.next(null);
    }
  }
  /// Verifica si el usuario está logueado consultando Firestore
isUserLoggedIn(): Observable<boolean> {
  const userStr = localStorage.getItem('user');  // Obtener el objeto 'user' completo desde localStorage
  if (!userStr) {
    return of(false);  // Si no hay usuario en localStorage, el usuario no está logueado
  }

  const user = JSON.parse(userStr);  // Parsear el objeto JSON del usuario
  if (user && user.uid) {
    return of(true);  // Si el objeto 'user' existe y tiene un 'uid', el usuario está logueado
  }

  return of(false);  // Si no tiene 'uid', el usuario no está logueado
}

  setUserLoggedIn(user: any) {
    localStorage.setItem('user', JSON.stringify(user)); // Guardamos el objeto completo del usuario
    this._authStateSubject.next(user); // Actualizamos el estado del usuario
  }

  // Método para verificar si el correo electrónico ya está registrado
  async correoYaRegistrado(email: string): Promise<boolean> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(query(usersRef, where('email', '==', email))); // Buscamos por email

      return !querySnapshot.empty; // Si hay resultados, el correo ya está registrado
    } catch (error) {
      console.error('Error al verificar el correo:', error);
      return false;
    }
  }
 
async registrarUsuario(
  email: string,
  contraseña: string,
  nombre: string,
  apellido:string,
  cedula: string,
  telefono: string,
  role: string,
  estado: string,
  fechaNacimiento: string,  // Agregar el campo de fecha de nacimiento


): Promise<boolean> {
  try {
    // Verificamos si el email ya está registrado antes de crear el usuario
    const emailExistente = await this.correoYaRegistrado(email);
    if (emailExistente) {
      return false; // Si el email ya existe, retornamos false
    }

    // Crear un nuevo documento en la colección 'users', generando un ID auto-generado por Firestore
    const newUserRef = doc(collection(this.firestore, 'users'));  // Esto generará un ID único automáticamente

    // Convertir fechaNacimiento a un objeto Timestamp
    //const fechaNacimientoTimestamp = Timestamp.fromDate(new Date(fechaNacimiento));  // Convierte la fecha de nacimiento a Timestamp

    // Lógica para guardar los datos completos si el rol es 'alumno'
    if (role === 'alumno') {
      // Aquí guardamos todos los datos necesarios para el rol alumno
      await setDoc(newUserRef, {
        nombre,
        apellido,
        cedula,  // Guardamos la cédula
        telefono,  // Guardamos el teléfono
        email,
        role,
        estado,
        contraseña,  // Guardar la contraseña en Firestore (aunque no es lo ideal)
        fechaNacimiento,  // Guardar la fecha de nacimiento como Timestamp
        fechaIngreso: Timestamp.now(), // Fecha en formato timestamp
      });
    } else {
      // Si el rol no es 'alumno', guardamos los datos básicos
      await setDoc(newUserRef, {
        nombre,
        apellido,
        cedula,  // Guardamos la cédula
        telefono,  // Guardamos el teléfono
        email,
        role,
        estado,
        contraseña,  // Guardar la contraseña en Firestore (aunque no es lo ideal)
        fechaNacimiento,  // Guardar la fecha de nacimiento como Timestamp
        fechaIngreso: Timestamp.now(), // Fecha en formato timestamp
      });

    }

    return true; // Si la operación fue exitosa, retornamos true
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    return false; // En caso de error, retornamos false
  }
}

  // Método para obtener el usuario por su email
  async getUserByEmail(email: string): Promise<any> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();  // Retorna los datos del primer usuario encontrado
      } else {
        return null;  // Si no se encuentra el usuario
      }
    } catch (error) {
      console.error('Error al obtener el usuario por email:', error);
      return null;  // En caso de error, retornamos null
    }
  }

  async login(email: string, contraseña: string): Promise<boolean> {
    try {
      // Referencia a la colección 'users'
      const usersRef = collection(this.firestore, 'users');
      
      // Realizar una consulta para encontrar el documento donde el campo 'email' coincida
      const q = query(usersRef, where('email', '==', email));
  
      // Ejecutar la consulta
      const querySnapshot = await getDocs(q);
  
      // Si se encuentra al menos un usuario con el email
      if (!querySnapshot.empty) {
        // Obtenemos el primer documento (debería ser único si el email es único)
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const storedPassword = userData?.['contraseña'];  // Contraseña almacenada en Firestore
  
        // Compara las contraseñas
        if (storedPassword === contraseña) {
          // Si la contraseña es correcta, almacenamos la sesión
  
          // Crear el objeto de usuario con los datos relevantes
          const user = {
            email: email,
            uid: userDoc.id,  // Guardamos el 'uid' del usuario
            role: userData?.['role'],
            nombre: userData?.['nombre'],  // Asumiendo que tienes el nombre del usuario
            telefono: userData?.['telefono'],  // Asumiendo que tienes el teléfono del usuario
            cedula: userData?.['cedula']  // Asumiendo que tienes la cédula del usuario
          };
  
          // Guardar el usuario en localStorage
          localStorage.setItem('user', JSON.stringify(user));
  
          // Actualizamos el estado del usuario (si estás usando un Subject para manejar el estado)
          this._authStateSubject.next(user);
  
          return true;  // Login exitoso
        } else {
          console.log('Contraseña incorrecta');
          return false;  // Contraseña incorrecta
        }
      } else {
        console.log('Usuario no encontrado');
        return false;  // Usuario no encontrado
      }
    } catch (error) {
      console.error('Error al intentar hacer login:', error);
      return false;  // Error en el login
    }
  }


   // Método para obtener el rol del usuario desde Firestore
   getUserRole(email: string): Observable<any> {
    const userRef = doc(this.firestore, 'users', email); // Buscamos al usuario por su email
    return new Observable(observer => {
      getDoc(userRef).then(docSnapshot => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          observer.next(userData?.['role']); // Devolvemos el rol del usuario
        } else {
          observer.next(null); // Si no existe el usuario, devolvemos null
        }
        observer.complete();
      }).catch(() => {
        observer.next(null); // En caso de error, devolvemos null
        observer.complete();
      });
    });
  }

 // Método para cerrar sesión
logout(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      localStorage.removeItem('user');  // Eliminar el usuario del localStorage
      this._authStateSubject.next(null);  // Limpiar el estado de la sesión
      this.router.navigate(['']);  // Redirigir al home o página inicial
      resolve();  // Resuelve la promesa
    } catch (error) {
      reject(error);  // Si hay un error, rechazar la promesa
    }
  });
}

  // Obtener el estado actual del usuario
  getCurrentUser() {
    return this._authStateSubject.value;
  }



  // Obtener todos los usuarios registrados
  async obtenerUsuarios(): Promise<any[]> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersRef); // Recupera todos los documentos de la colección 'users'

      const users: any[] = [];
      querySnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return users; // Devuelve el array de usuarios
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      return []; // Si hay un error, devolvemos un array vacío
    }
  }

   // Método para actualizar un usuario existente
   async actualizarUsuario(
    id: string,
    email: string,
    contraseña: string,
    nombre: string,
    apellido: string,
    cedula: string,
    telefono: string,
    role: string,
    estado: string,
    fechaNacimiento: string,  // Guardar la fecha de nacimiento como Timestamp
  ): Promise<boolean> {
    try {
      const usuarioDocRef = doc(this.firestore, 'users', id); // Referencia al documento específico
      await updateDoc(usuarioDocRef, {
        email,
        contraseña,
        nombre,
        apellido,
        cedula,
        telefono,
        role,
        estado,
        fechaNacimiento,  // Guardar la fecha de nacimiento como Timestamp
        fechaActualizacion: Timestamp.now(), // Fecha en formato timestamp
      });
  
      return true;
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      return false;
    }
  }
  

  // Método para eliminar un usuario
  async eliminarUsuario(userId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await deleteDoc(userDocRef); // Elimina el documento de Firestore
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      throw error; // Lanza el error para que se pueda manejar en el componente
    }
  }
}