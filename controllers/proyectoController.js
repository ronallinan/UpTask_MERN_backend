import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";

const obtenerProyectos = async (req, res) => {
    // const proyectos = await Proyecto.find().where("creador").equals(req.usuario).select("-tareas");
    const proyectos = await Proyecto.find({ $or: [ { colaboradores: { $in: req.usuario } }, { creador: { $in: req.usuario } }, ], }).select("-tareas");
    res.json(proyectos);
};


const nuevoProyecto = async (req, res) => {
    const proyecto = new Proyecto(req.body)
    proyecto.creador = req.usuario._id

    try {
        const proyectoAlmacenado = await proyecto.save()
        res.json(proyectoAlmacenado)
    } catch (error) { 
        console.log(error);
    }    
};

const obtenerProyecto = async (req, res) => {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id)
        // .populate("tareas")
        .populate({ 
            path: "tareas", 
            populate: { path: "completado", select: "nombre"},
        })
        .populate("colaboradores", "nombre email");

    if(!proyecto) {
        // return res.status(404).json({ msg: "No Encontrado" });

        const error = new Error("No Encontrado");
        return res.status(404).json({ msg: error.message });
    }

    // if (proyecto.creador.toString()!==req.usuario._id.toString()) {
    if (proyecto.creador.toString()!==req.usuario._id.toString() && !proyecto.colaboradores.some((colaborador) => colaborador._id.toString() === req.usuario._id.toString())) {
        // return res.status(401).json({ msg: "Acción No Válida" })

        const error = new Error("Acción No Válida");
        return res.status(404).json({ msg: error.message });
    }   

    // Obtener las tareas del Proyecto
    // const tareas = await Tarea.find().where("proyecto").equals(proyecto.id);
    
    // res.json({
    //     proyecto,
    //     tareas,
    // });

    res.json(proyecto);
};

const editarProyecto = async (req, res) => {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id);

    if(!proyecto) {        
        const error = new Error("No Encontrado");
        return res.status(404).json({ msg: error.message });
    }

    if (proyecto.creador.toString()!==req.usuario._id.toString()) {        
        const error = new Error("Acción No Válida");
        return res.status(404).json({ msg: error.message });
    }   
    
    proyecto.nombre = req.body.nombre || proyecto.nombre;
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
    proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;
    proyecto.cliente = req.body.cliente || proyecto.cliente;

    try {
        const proyectoAlmacenado = await proyecto.save();
        res.json(proyectoAlmacenado);
        
    } catch (error) {
        console.log(error);
    }
};

const eliminarProyecto = async (req, res) => {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id);

    if(!proyecto) {        
        const error = new Error("No Encontrado");
        return res.status(404).json({ msg: error.message });
    }

    if (proyecto.creador.toString()!==req.usuario._id.toString()) {        
        const error = new Error("Acción No Válida");
        return res.status(404).json({ msg: error.message });
    }
    
    try {
        await proyecto.deleteOne();
        res.json({msg: "Proyecto Eliminado"});
    } catch (error) {
        console.log(error)
    }
}; 


const buscarColaborador = async (req, res) => {
    const { email } = req.body
    const usuario = await Usuario.findOne({ email }).select("-confirmado -createAt -password -token -updatedAt -__v");

    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        return res.status(404).json({ msg: error.message });
    }

    res.json(usuario);
};

const agregarColaborador = async (req, res) => {    
    const proyecto = await Proyecto.findById(req.params.id);

    // Verificar si el proyecto existe
    if(!proyecto) {
        const error = new Error("Proyecto No Encontrado");
        return res.status(404).json({ msg: error.message });
    }

    // Verificar quien quines esta agregando al proyecto es la persona que tiene los derechos de hacerlo
    if (proyecto.creador.toString() != req.usuario._id.toString()) {
        const error = new Error("Accion no válida");
        return res.status(404).json({ msg: error.message});
    }

    const { email } = req.body
    const usuario = await Usuario.findOne({ email }).select("-confirmado -createAt -password -token -updatedAt -__v");

    // Verificar que el usuario exista
    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        return res.status(404).json({ msg: error.message });
    }

    // El colaborador no es el admin del proyecto
    if(proyecto.creador.toString() === usuario._id.toString() ) {
        const error = new Error("El Creador del Proyecto no puede ser colaborador");
        return res.status(404).json({ msg: error.message });        
    }

    // Revisar que no este ya agregado al proyecto
    if(proyecto.colaboradores.includes(usuario._id)) {
        const error = new Error("El Usuario ya pertenece al proyecto");
        return res.status(404).json({ msg: error.message });        
    }

    // Esta bien, se puede agregar
    proyecto.colaboradores.push(usuario._id);
    await proyecto.save();
    res.json({ msg: "Colaborador Agregado Correctamente" });
};

const eliminarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id);

    // Verificar si el proyecto existe
    if(!proyecto) {
        const error = new Error("Proyecto No Encontrado");
        return res.status(404).json({ msg: error.message });
    }

    // Verificar quien quienes esta agregando al proyecto es la persona que tiene los derechos de hacerlo
    if (proyecto.creador.toString() != req.usuario._id.toString()) {
        const error = new Error("Accion no válida");
        return res.status(404).json({ msg: error.message});
    }  
    
    // Esta bien, se puede eliminar
    proyecto.colaboradores.pull(req.body.id);
        
    await proyecto.save();
    res.json({ msg: "Colaborador Eliminado Correctamente" });
};

// const obtenerTareas = async (req, res) => {
//     const { id } = req.params;

//     const existeProyecto = await Proyecto.findById(id);
//     if (!existeProyecto) {
//         const error = new Error("No Encontrado");
//         return res.status(404).json({msg: error.message});
//     }

//     // Tienes que ser el creador del proyecto o colaborador

//     const tareas = await Tarea.find().where("proyecto").equals(id);

//     res.json(tareas)
// };

export {
    obtenerProyectos,
    nuevoProyecto,
    obtenerProyecto,
    editarProyecto,
    eliminarProyecto,
    buscarColaborador,
    agregarColaborador,
    eliminarColaborador,
    // obtenerTareas,
};