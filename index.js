const express = require('express'); // importa express
const fs = require('fs'); // importa fs para leer y escribir archivos
const bodyParser = require('body-parser');

const bodyP = bodyParser.json();
const app = express(); // inicializamos la app con express

app.use(bodyP);

const port = 3000; // define el puerto donde se levanta el servidor

// función para leer los datos (archivo JSON)
const leerDatos = () => {
    try {
        const datos = fs.readFileSync('./datos.json'); // leer el archivo datos.json
        return JSON.parse(datos); // convierte datos en formato JSON y los retorna
    } catch (error) {
        console.error('Error al leer datos:', error);
        return { proyectos: [], tareas: [], usuarios: [], administradores: [] }; // Retorna estructura vacía en caso de error
    }
};

// función para escribir en la base de datos (archivo JSON)
const escribir = (datos) => {
    try {
        fs.writeFileSync('./datos.json', JSON.stringify(datos, null, 2)); // escribe los datos en formato JSON, en el archivo datos.json
    } catch (error) {
        console.error('Error al escribir datos:', error);
    }
};

// Función para validar el cuerpo de la solicitud
const validarCuerpo = (req, res, requiredFields) => {
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ error: `El campo ${field} es requerido.` });
        }
    }
    return null;
};

app.get('/', (req, res) => {
    res.send('API de gestión de proyectos y tareas'); // lo que se le va a mostrar al usuario apenas arranque el servidor
});

// Proyectos

// Muestra todos los proyectos
app.get('/ListarProyectos', (req, res) => {
    const datos = leerDatos(); // lee los datos del archivo JSON
    res.json(datos.proyectos); // devuelve el array de proyectos
});

// Busca proyecto por su id
app.get('/BuscarProyecto/:nroProyecto', (req, res) => {
    const datos = leerDatos();
    
    // Verifica si el parámetro es un número
    const nroProyecto = parseInt(req.params.nroProyecto);
    if (isNaN(nroProyecto)) {
        return res.status(400).send('El parámetro nroProyecto debe ser un número.');
    }

    // Busca el proyecto por ID
    const proyecto = datos.proyectos.find((proyecto) => proyecto.id === nroProyecto);

    if (proyecto) {
        res.json(proyecto); // Si encuentra el ID proporcionado, muestra ese proyecto
    } else {
        res.status(404).send('Proyecto no encontrado.'); // Muestra este mensaje si no se encuentra el proyecto
    }
});
// Actualizar proyecto
app.put('/ActualizarProyecto/:nroProyecto', (req, res) => {
    const datos = leerDatos();
    const nroProyecto = parseInt(req.params.nroProyecto); // recupera el id puesto por parámetros
    const buscarIndex = datos.proyectos.findIndex((proyecto) => proyecto.id === nroProyecto); // busca el id indicado en array

    if (buscarIndex === -1) {
        return res.status(404).send('Proyecto no encontrado.');
    }

    // Actualiza el proyecto con los nuevos datos
    datos.proyectos[buscarIndex] = {
        ...datos.proyectos[buscarIndex],
        ...req.body,
    };

    escribir(datos); // escribe los nuevos datos en el JSON
    res.json({ message: 'Proyecto actualizado' }); // lo que se le muestra al usuario
});

// Cambiar estado de proyecto
app.delete('/EstadoProyecto/:nroProyecto', (req, res) => {
    const datos = leerDatos();
    const nroProyecto = parseInt(req.params.nroProyecto);
    const proyecto = datos.proyectos.find((proyecto) => proyecto.id === nroProyecto);

    if (proyecto) {
        proyecto.estado = proyecto.estado === 'Incompleto' ? 'Completado' : 'Incompleto';
        escribir(datos); // escribe los nuevos datos en el JSON
        res.json({ message: 'Estado cambiado' }); // lo que se le muestra al usuario
    } else {
        res.status(404).send('Proyecto no encontrado.');
    }
});

// Cargar proyecto
app.post('/SubirProyecto', (req, res) => {
    const error = validarCuerpo(req, res, ['nombre', 'descripcion']);
    if (error) return error;

    const datos = leerDatos();
    const nuevoProyecto = {
        id: datos.proyectos.length ? datos.proyectos[datos.proyectos.length - 1].id + 1 : 1, // se le asigna un id automático
        ...req.body,
    };

    datos.proyectos.push(nuevoProyecto);
    escribir(datos);
    res.status(201).json(nuevoProyecto); // Respuesta con el nuevo proyecto creado
});
// Usuarios

// Muestra todos los usuarios
app.get('/ListarUsuarios', (req, res) => {
    const datos = leerDatos();
    res.json(datos.usuarios);
});

// Busca usuarios por su dni
app.get('/BuscarUsuario/:dni', (req, res) => {
    const datos = leerDatos();
    const dni = parseInt(req.params.dni);
    const usuario = datos.usuarios.find((usuario) => usuario.dni === dni);

    if (usuario) {
        res.json(usuario);
    } else {
        res.status(404).send('Usuario no encontrado.');
    }
});

// Cargar usuario
app.post('/SubirUsuario', (req, res) => {
    const error = validarCuerpo(req, res, ['nombre', 'email']);
    if (error) return error;

    const datos = leerDatos();
    const nuevoUsuario = {
        id: datos.usuarios.length ? datos.usuarios[datos.usuarios.length - 1].id + 1 : 1, // Se le asigna un id automático
        ...req.body,
    };

    datos.usuarios.push(nuevoUsuario);
    escribir(datos);
    res.status(201).json(nuevoUsuario);
});

// Actualizar usuario
app.put('/ActualizarUsuario/:dni', (req, res) => {
    const datos = leerDatos();
    const dni = parseInt(req.params.dni);
    const buscarIndex = datos.usuarios.findIndex((usuario) => usuario.dni === dni);

    if (buscarIndex === -1) {
        return res.status(404).send('Usuario no encontrado.');
    }

    datos.usuarios[buscarIndex] = {
        ...datos.usuarios[buscarIndex],
        ...req.body,
    };

    escribir(datos);
    res.json({ message: 'Usuario actualizado' });
});

// Cambiar estado de usuario
app.delete('/EstadoUsuario/:dni', (req, res) => {
    const datos = leerDatos();
    const dni = parseInt(req.params.dni);
    const usuario = datos.usuarios.find((usuario) => usuario.dni === dni);

    if (usuario) {
        usuario.estado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
        escribir(datos);
        res.json({ message: 'Estado cambiado' });
    } else {
        res.status(404).send('Usuario no encontrado.');
    }
});

// Tareas

// Muestra todas las tareas 
app.get('/ListarTareas', (req, res) => {
    const datos = leerDatos();
    res.json(datos.tareas);
});

// Busca tarea por su id
app.get('/BuscarTarea/:nroTarea', (req, res) => {
    const datos = leerDatos();
    const nroTarea = parseInt(req.params.nroTarea);
    const tarea = datos.tareas.find((tarea) => tarea.nroTarea === nroTarea);

    if (tarea) {
        res.json(tarea);
    } else {
        res.status(404).send('Tarea no encontrada.');
    }
});

// Cargar tarea
app.post('/SubirTarea', (req, res) => {
    const error = validarCuerpo(req, res, ['nombre', 'descripcion', 'proyectoId']);
    if (error) return error;

    const datos = leerDatos();
    const nuevaTarea = {
        nroTarea: datos.tareas.length ? datos.tareas[datos.tareas.length - 1].nroTarea + 1 : 1, // Se le asigna un id automático
        ...req.body,
    };

    datos.tareas.push(nuevaTarea);
    escribir(datos);
    res.status(201).json(nuevaTarea);
});

// Actualizar tarea
app.put('/ActualizarTarea/:nroTarea', (req, res) => {
    const datos = leerDatos();
    const nroTarea = parseInt(req.params.nroTarea);
    const buscarIndex = datos.tareas.findIndex((tarea) => tarea.nroTarea === nroTarea);

    if (buscarIndex === -1) {
        return res.status(404).send('Tarea no encontrada.');
    }

    datos.tareas[buscarIndex] = {
        ...datos.tareas[buscarIndex],
        ...req.body,
    };

    escribir(datos);
    res.json({ message: 'Tarea actualizada' });
});

// Cambiar estado de la tarea
app.delete('/EstadoTarea/:nroTarea', (req, res) => {
    const datos = leerDatos();
    const nroTarea = parseInt(req.params.nroTarea);
    const tarea = datos.tareas.find((tarea) => tarea.nroTarea === nroTarea);

    if (tarea) {
        tarea.estado = tarea.estado === 'Sin completar' ? 'Completada' : 'Sin completar';
        escribir(datos);
        res.json({ message: 'Estado cambiado' });
    } else {
        res.status(404).send('Tarea no encontrada.');
    }
});

// Administradores

// Muestra todos los administradores 
app.get('/ListarAdministradores', (req, res) => {
    const datos = leerDatos();
    res.json(datos.administradores);
});

// Busca administrador por su id
app.get('/BuscarAdministrador/:nroAdministrador', (req, res) => {
    const datos = leerDatos();
    const nroAdministrador = parseInt(req.params.nroAdministrador);
    const administrador = datos.administradores.find((administrador) => administrador.nroAdministrador === nroAdministrador);

    if (administrador) {
        res.json(administrador);
    } else {
        res.status(404).send('Administrador no encontrado.');
    }
});

// Cargar administrador
app.post('/SubirAdministrador', (req, res) => {
    const error = validarCuerpo(req, res, ['nombre', 'email']);
    if (error) return error;

    const datos = leerDatos();
    const nuevoAdministrador = {
        nroAdministrador: datos.administradores.length ? datos.administradores[datos.administradores.length - 1].nroAdministrador + 1 : 1,
        ...req.body,
    };

    datos.administradores.push(nuevoAdministrador);
    escribir(datos);
    res.status(201).json(nuevoAdministrador);
});

// Actualizar administrador
app.put('/ActualizarAdministrador/:nroAdministrador', (req, res) => {
    const datos = leerDatos();
    const nroAdministrador = parseInt(req.params.nroAdministrador);
    const buscarIndex = datos.administradores.findIndex((administrador) => administrador.nroAdministrador === nroAdministrador);

    if (buscarIndex === -1) {
        return res.status(404).send('Administrador no encontrado.');
    }

    datos.administradores[buscarIndex] = {
        ...datos.administradores[buscarIndex],
        ...req.body,
    };

    escribir(datos);
    res.json({ message: 'Administrador actualizado' });
});

// Cambiar estado del administrador
app.delete('/EstadoAdministrador/:nroAdministrador', (req, res) => {
    const datos = leerDatos();
    const nroAdministrador = parseInt(req.params.nroAdministrador);
    const administrador = datos.administradores.find((administrador) => administrador.nroAdministrador === nroAdministrador);

    if (administrador) {
        administrador.estado = administrador.estado === 'Inactivo' ? 'Activo' : 'Inactivo';
        escribir(datos);
        res.json({ message: 'Estado cambiado' });
    } else {
        res.status(404).send('Administrador no encontrado.');
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});