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
  

// Método para crear el periodo con niveles
async crearPeriodoConNiveles(periodoData: any, nivelesSeleccionados: { id: string, nombre: string }[]): Promise<void> {
  const periodosCollection = collection(this.firestore, 'periodos');
  
  // Asegúrate de que las fechas sean convertidas antes de enviar a Firestore
  const periodoConFechas = {
    ...periodoData,
    fechaInicio: periodoData.fechaInicio ? Timestamp.fromDate(new Date(periodoData.fechaInicio)) : null,
    fechaFin: periodoData.fechaFin ? Timestamp.fromDate(new Date(periodoData.fechaFin)) : null,
    fechaCreacion: Timestamp.now(),
    fechaModificacion: Timestamp.now(),
  };

  try {
    const nuevoPeriodoDoc = await addDoc(periodosCollection, periodoConFechas);
    console.log('Período creado con éxito', nuevoPeriodoDoc);
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
          fechaInicio: periodoData.fechaInicio ? Timestamp.fromDate(new Date(periodoData.fechaInicio)) : null,
          fechaFin: periodoData.fechaFin ? Timestamp.fromDate(new Date(periodoData.fechaFin)) : null,

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
// Método para obtener los datos de matrícula
async getMatriculaporId(matriculaId: string): Promise<any> {
  try {
    const matriculaDocRef = doc(this.firestore, 'matriculas', matriculaId);
    const matriculaSnapshot = await getDoc(matriculaDocRef);
    if (matriculaSnapshot.exists()) {
      return matriculaSnapshot.data();
    } else {
      throw new Error('Matrícula no encontrada');
    }
  } catch (error) {
    console.error('Error al obtener datos de matrícula:', error);
    return {};
  }
}
// Método para obtener las matrículas asociadas a los periodos activos
async getMatriculasPorUsuarioYPeriodosActivos(usuarioId: string): Promise<any[]> {
  try {
    const periodosActivos = await this.getPeriodosActivos();  // Obtener los periodos activos
    const periodosActivosIds = periodosActivos.map(p => p.id); // Extraer solo los IDs de los periodos activos

    // Obtener todas las matrículas
    const matriculas = await this.getMatriculas();

    // Filtrar las matrículas que pertenecen a los periodos activos y al usuario
    const matriculasFiltradas = matriculas.filter(matricula => 
      periodosActivosIds.includes(matricula.periodoId) && matricula.alumnoId === usuarioId // Filtra por periodoId y alumnoId
    );

    return matriculasFiltradas;
  } catch (error) {
    console.error('Error al obtener matrículas por usuario y periodos activos:', error);
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
// Agregar una nueva asistencia al array existente con la fecha incluida
async agregarAsistenciaACurso(cursoId: string, nuevaAsistencia: any): Promise<void> {
  // Verificar si los campos necesarios en nuevaAsistencia existen
  if (!nuevaAsistencia || !nuevaAsistencia.alumnos || nuevaAsistencia.alumnos.length === 0) {
    throw new Error("No se ha proporcionado información válida de asistencia");
  }

  const cursoRef = doc(this.firestore, 'cursos', cursoId); // Referencia al documento

  // Crear una copia de nuevaAsistencia y añadir la fecha
  const asistenciaConFecha = {
    ...nuevaAsistencia,
    fechaAsistencia: Timestamp.now(), // Añadir la fecha automáticamente
  };

  // Verificar que todos los campos dentro de asistenciaConFecha sean válidos
  if (!asistenciaConFecha.alumnos || asistenciaConFecha.alumnos.length === 0) {
    throw new Error("No hay alumnos en la asistencia");
  }

  // Actualizar el documento
  await updateDoc(cursoRef, {
    asistencias: arrayUnion(asistenciaConFecha), // Agregar la nueva asistencia al array existente
  });
}

// Inicializar el array de asistencias si no existe, incluyendo la fecha
async inicializarAsistenciasCurso(cursoId: string, asistencias: any[]): Promise<void> {
  if (!asistencias || asistencias.length === 0) {
    throw new Error("No se ha proporcionado un array de asistencias válido");
  }

  const cursoRef = doc(this.firestore, 'cursos', cursoId); // Referencia al documento
  
  // Asegurarse de que todos los elementos de asistencias tengan la fecha
  const asistenciasConFecha = asistencias.map(asistencia => ({
    ...asistencia,
    fechaAsistencia: Timestamp.now(), // Añadir la fecha automáticamente
  }));

  // Verificar que no haya campos undefined
  if (asistenciasConFecha.some(asistencia => !asistencia.alumnos || asistencia.alumnos.length === 0)) {
    throw new Error("Al menos una asistencia no tiene alumnos");
  }

  await updateDoc(cursoRef, {
    asistencias: asistenciasConFecha, // Crear un nuevo array con las asistencias proporcionadas
  });
}

  // Función para convertir un archivo a base64
  private async convertToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);  // Convierte el archivo a base64
    });
  }

  // Método para guardar la justificación con el archivo PDF en Firestore
  async solicitarJustificacion(matriculaData: any, archivo: File): Promise<void> {
    try {
      // Paso 1: Convertir el archivo PDF a base64
      const archivoBase64 = await this.convertToBase64(archivo);

      // Paso 2: Crear el objeto de datos de la justificación, incluyendo el archivo en base64
      const periodoConFechas = {
        ...matriculaData,
        archivoPDF: archivoBase64,  // Guardar el archivo en base64
        fechaCreacion: Timestamp.now(),
      };

      // Paso 3: Guardar los datos en Firestore
      const matriculasCollection = collection(this.firestore, 'justificaciones');
      await addDoc(matriculasCollection, periodoConFechas); // Añade el documento con los datos de la justificación
      console.log('Justificación guardada correctamente');
    } catch (error) {
      console.error('Error al crear justificación:', error);
      throw new Error('Error al crear justificación');
    }
  }

   // Obtener las justificaciones
   async getJustificaciones(): Promise<any[]> {
    try {
      const cursosCollection = collection(this.firestore, 'justificaciones');
      const snapshot = await getDocs(cursosCollection);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error) {
      console.error('Error al obtener justificaciones:', error);
      return [];
    }
  }

  async actualizarAsistenciaCurso(cursoId: string, asistenciasActualizadas: any[]): Promise<void> {
    try {
      const cursoRef = doc(this.firestore, 'cursos', cursoId);
      await updateDoc(cursoRef, { asistencias: asistenciasActualizadas });
      console.log('Asistencias actualizadas correctamente.');
    } catch (error) {
      console.error('Error al actualizar las asistencias:', error);
      throw new Error('No se pudo actualizar las asistencias.');
    }
  }


  async justificarFalta(justificacionId: string): Promise<void> {
    try {
      // Referencia al documento de la justificación que queremos actualizar
      const justificacionDocRef = doc(this.firestore, 'justificaciones', justificacionId);
  
      // Obtener la fecha actual
      const fechaJustificacion = Timestamp.now();
  
      // Actualizar el documento con la nueva fecha y el estado 'Justificado'
      await updateDoc(justificacionDocRef, {
        estado: 'Justificado',      // Cambiar el estado a "Justificado"
        fechaJustificacion: fechaJustificacion,  // Añadir la fecha de la justificación
      });
  
      console.log(`Justificación ${justificacionId} actualizada correctamente`);
    } catch (error) {
      console.error('Error al justificar la falta:', error);
      throw new Error('Error al justificar la falta');
    }
  }

}

