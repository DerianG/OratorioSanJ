import { Injectable,inject } from '@angular/core';
import { Firestore, Timestamp, doc,addDoc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, arrayRemove, arrayUnion} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

interface Docente {
  docenteId: string;
  docenteNombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatosFireService {
  private firestore = inject(Firestore);

  constructor() {}

  /**
   * Obtener todos los períodos desde Firestore.
   */
  async getPeriodos(): Promise<any[]> {
    const periodosCollection = collection(this.firestore, 'periodos');
    const snapshot = await getDocs(periodosCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Crear un período con una subcolección de niveles.
   */

  async crearPeriodoConNiveles(periodoData: any, nivelesSeleccionados: { id: string, nombre: string }[]): Promise<void> {
    const periodosCollection = collection(this.firestore, 'periodos');
 
    const periodoConFechas = {
      ...periodoData,
      fechaCreacion: Timestamp.now(),
      fechaModificacion: Timestamp.now(),
   
    };
  
    try {
      const nuevoPeriodoDoc = await addDoc(periodosCollection, periodoConFechas);
    } catch (error) {
      console.error('Error al crear el período:', error);
      window.alert('Ocurrió un error al crear el período.');
    }
  }
  
  /**
   * Actualizar un período con una nueva fecha de modificación.
   */
  async actualizarPeriodo(id: string, periodoData: any): Promise<void> {
    const periodoDoc = doc(this.firestore, 'periodos', id);
    const periodoConFechaModificacion = {
      ...periodoData,
      fechaModificacion: Timestamp.now(),
    };
    await updateDoc(periodoDoc, periodoConFechaModificacion);
  }
 

  async actualizarPeriodoConNiveles(id: string, periodoData: any, nivelesSeleccionados: { id: string, nombre: string }[]): Promise<void> {
    try {
      const nivelesCollectionRef = collection(this.firestore, `periodos/${id}/niveles`);
      const nivelesSnapshot = await getDocs(nivelesCollectionRef);
  
      if (nivelesSeleccionados.length === 0) {
        window.alert('Debes seleccionar al menos un nivel.');
        return;
      }
  
      // Crear el documento del período con solo los niveles seleccionados (con id y nombre)
      const periodoConFechaModificacion = {
        ...periodoData,
        fechaModificacion: Timestamp.now(),
      
      };
  
      const periodoDocRef = doc(this.firestore, 'periodos', id);
      await updateDoc(periodoDocRef, periodoConFechaModificacion);
  
    } catch (error) {
      console.error('Error al actualizar el período con niveles:', error);
      window.alert('Ocurrió un error al actualizar el período.');
    }
  }
  /**
   * Eliminar un período por ID.
   */
  async eliminarPeriodo(id: string): Promise<void> {
    const periodoDocRef = doc(this.firestore, `periodos/${id}`);
    await deleteDoc(periodoDocRef);
  }

  /**
   * Obtener todos los niveles desde Firestore.
   */
  async getNiveles(): Promise<any[]> {
    const nivelesCollection = collection(this.firestore, 'niveles');
    const snapshot = await getDocs(nivelesCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Obtener niveles asociados a un período específico.
   */
 // Obtener los niveles asociados a un período específico
 async getNivelesPorPeriodo(periodoId: string): Promise<any[]> {
  const periodoDocRef = doc(this.firestore, 'periodos', periodoId);
  const periodoDoc = await getDoc(periodoDocRef);

  if (periodoDoc.exists()) {
    // Obtener los niveles desde el campo 'niveles' del documento
    return periodoDoc.data()?.["nivelesSeleccionados"] || [];  // Si no existe el campo 'niveles', devolver un array vacío
  } else {
    console.warn('El período no existe');
    return [];
  }
}

// Obtener los períodos activos desde Firestore
async getPeriodosActivos(): Promise<any[]> {
  const periodosCollection = collection(this.firestore, 'periodos');
  const q = query(periodosCollection, where('estado', '==', 'activo')); // Filtrar períodos activos
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}


// Método para obtener los paralelos de un nivel específico
async getParalelos(): Promise<any[]> {
  const paralelosCollection = collection(this.firestore, 'paralelos');
  const snapshot = await getDocs(paralelosCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(), // Asegúrate de que tus documentos tienen el campo `nombre`
  }));
}

async validarMatriculaUnica(matriculaData: any): Promise<boolean> {
  try {
    if (!matriculaData.periodoId || !matriculaData.alumnoId) {
      throw new Error('Periodo o alumno no definidos.');
    }
    
    const matriculasCollection = collection(this.firestore, 'matriculas');
    const q = query(
      matriculasCollection,
      where('periodoId', '==', matriculaData.periodoId),
      where('alumnoId', '==', matriculaData.alumnoId)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty; // Si no hay documentos, es única
  } catch (error) {
    console.error('Error al validar matrícula:', error);
    throw new Error('Error al validar matrícula');
  }
}

async crearMatricula(matriculaData: any): Promise<void> {
  try {
    const matriculasCollection = collection(this.firestore, 'matriculas');
    const periodoConFechas = {
      ...matriculaData,
      fechaCreacion: Timestamp.now(),
      fechaModificacion: Timestamp.now(),
    };
    await addDoc(matriculasCollection, periodoConFechas); // Añade el documento con los datos de la matrícula
  } catch (error) {
    console.error('Error al crear matrícula:', error);
    throw new Error('Error al crear matrícula');
  }
}
async getMatriculas(): Promise<any[]> {
  try {
    const matriculasCollection = collection(this.firestore, 'matriculas');
    const snapshot = await getDocs(matriculasCollection);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaMatricula: data['fechaMatricula'] instanceof Timestamp
          ? data['fechaMatricula']
          : Timestamp.fromDate(new Date(data['fechaMatricula'])), // Asegura que sea un Timestamp
      }; 
    });
  } catch (error) {
    console.error('Error al obtener matrículas:', error);
    return [];
  }
}
async eliminarMatricula(id: string): Promise<void> {
  try {
    const matriculaDocRef = doc(this.firestore, `matriculas/${id}`); // Ajusta 'matriculas' según el nombre de tu colección
    await deleteDoc(matriculaDocRef);
    console.log(`Matrícula con ID ${id} eliminada exitosamente`);
  } catch (error) {
    console.error('Error al eliminar matrícula:', error);
    throw error;
  }
}

async actualizarMatricula(matriculaData: any): Promise<void> {
  try {
    if (!matriculaData.matriculaId) {
      throw new Error('El ID de la matrícula es obligatorio para actualizar.');
    }
    console.log(matriculaData.matriculaId)
    const matriculaDocRef = doc(this.firestore, 'matriculas', matriculaData.matriculaId); // Referencia al documento específico
    const datosActualizados = {
      ...matriculaData,
      fechaModificacion: Timestamp.now(), // Actualiza la fecha de modificación
    };

    // Actualizar documento en Firestore
    await updateDoc(matriculaDocRef, datosActualizados);
  } catch (error) {
    console.error('Error al actualizar matrícula:', error);
    throw new Error('Error al actualizar matrícula');
  }
}


async crearCursoProfesor(cursoProfesorData: any): Promise<void> {
  try {
    // Referencia a la colección 'cursos' en Firestore
    const cursosCollection = collection(this.firestore, 'cursos');

    // Preparando los datos a almacenar
    const cursoConFechas = {
      ...cursoProfesorData,
      fechaCreacion: Timestamp.now(), // Fecha de creación
    };

    // Añadir los datos del nuevo curso en Firestore
    await addDoc(cursosCollection, cursoConFechas);
    console.log('Curso profesor guardado exitosamente.');
  } catch (error) {
    console.error('Error al crear curso profesor:', error);
    throw new Error('Error al crear curso profesor');
  }
}

async getCursoProfesor(): Promise<any[]> {
  try {
    const cursosCollection = collection(this.firestore, 'cursos');
    const snapshot = await getDocs(cursosCollection);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      }; 
    });
  } catch (error) {
    console.error('Error al obtener CursoProfesor:', error);
    return [];
  }
}


async quitarDocenteDelCurso(docenteId: string, periodoId: string, nivelId: string, paraleloId: string): Promise<void> {
  try {
    // Obtener todos los cursos
    const cursos = await this.getCursoProfesor();
    
    // Buscar el curso que coincida con el periodoId, nivelId y paraleloId
    const curso = cursos.find(curso => 
      curso.periodoId === periodoId &&
      curso.nivelId === nivelId &&
      curso.paraleloId === paraleloId
    );
    
    if (!curso) {
      console.error('Curso no encontrado');
      throw new Error('Curso no encontrado');
    }

    // Recuperar el array de docentes del curso
    const docentes: any[] = curso.docentes || [];
    
    // Buscar el docente a eliminar en el array
    const docenteAEliminar = docentes.find(docente => docente.docenteId === docenteId);

    if (!docenteAEliminar) {
      console.error('Docente no encontrado en el curso');
      throw new Error('Docente no encontrado');
    }

    // Actualizar el documento, eliminando al docente del array 'docentes'
    const cursoRef = doc(this.firestore, 'cursos', curso.id);
    await updateDoc(cursoRef, {
      docentes: arrayRemove(docenteAEliminar) // Eliminamos el docente completo
    });

    console.log('Docente eliminado del curso en Firestore');
    alert('Docente eliminado exitosamente');
  } catch (error) {
    console.error('Error al eliminar docente del curso:', error);
    alert('Error al eliminar docente');
    throw new Error('No se pudo eliminar el docente del curso');
  }
}
async actualizarCursoConDocente(cursoProfesorData: any): Promise<void> {
  try {
    // Obtener todos los cursos
    const cursos = await this.getCursoProfesor();
    
    // Buscar el curso que coincida con periodoId, nivelId y paraleloId
    const cursoExistente = cursos.find(curso =>
      curso.periodoId === cursoProfesorData.periodoId &&
      curso.nivelId === cursoProfesorData.nivelId &&
      curso.paraleloId === cursoProfesorData.paraleloId
    );

    if (!cursoExistente) {
      console.error('Curso no encontrado');
      throw new Error('Curso no encontrado');
    }

    // Verificar si el docente ya está asignado al curso
    const docenteExistente = cursoExistente.docentes.find((docente: Docente) =>
      docente.docenteId === cursoProfesorData.docentes[0].docenteId
    );

    if (docenteExistente) {
      console.log('El docente ya está asignado a este curso');
      throw new Error('El docente ya está asignado a este curso');
    }

    // Si el docente no está asignado, agregarlo al array de docentes
    const cursoRef = doc(this.firestore, 'cursos', cursoExistente.id);
    await updateDoc(cursoRef, {
      docentes: arrayUnion(cursoProfesorData.docentes[0]) // Añadir el docente al array 'docentes'
    });

    console.log('Docente asignado correctamente al curso');
  } catch (error) {
    console.error('Error al actualizar curso con el docente:', error);
    throw new Error('No se pudo asignar el docente al curso');
  }
}
// Agregar una nueva asistencia al array existente
async agregarAsistenciaACurso(cursoId: string, nuevaAsistencia: any): Promise<void> {
  const cursoRef = doc(this.firestore, 'cursos', cursoId); // Referencia al documento
  await updateDoc(cursoRef, {
    asistencias: arrayUnion(nuevaAsistencia), // Agregar la nueva asistencia al array existente
  });
}

// Inicializar el array de asistencias si no existe
async inicializarAsistenciasCurso(cursoId: string, asistencias: any[]): Promise<void> {
  const cursoRef = doc(this.firestore, 'cursos', cursoId); // Referencia al documento
  await updateDoc(cursoRef, {
    asistencias: asistencias, // Crear un nuevo array con las asistencias proporcionadas
  });
}

// Crear un nuevo curso con asistencia
async crearCursoConAsistencia(cursoData: any): Promise<void> {
  const cursosCollection = collection(this.firestore, 'cursos'); // Referencia a la colección
  await addDoc(cursosCollection, cursoData); // Agregar los datos del curso como un nuevo documento
}




}

