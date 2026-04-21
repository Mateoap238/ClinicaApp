// ==================== ESTADO DE LA APLICACIÓN ====================
const state = {
  medicos: JSON.parse(localStorage.getItem("medicos")) || [],
  citas: JSON.parse(localStorage.getItem("citas")) || [],
  citaEditando: null,
  medicoEditando: null,
};

// ==================== UTILIDADES ====================
const guardarEnLocalStorage = () => {
  localStorage.setItem("medicos", JSON.stringify(state.medicos));
  localStorage.setItem("citas", JSON.stringify(state.citas));
};

const generarId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const formatearFecha = (fecha) => {
  const [year, month, day] = fecha.split("-").map(Number);
  const date = new Date(year, month - 1, day); // Fix UTC: usar fecha local
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatearHora = (hora) => {
  const [hours, minutes] = hora.split(":");
  return `${hours}:${minutes}`;
};

// ==================== NAVEGACIÓN ====================
const inicializarNavegacion = () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".content-section");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      sections.forEach((s) => s.classList.remove("active"));
      const sectionId = link.getAttribute("data-section");
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.classList.add("active");
      }
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active");
      }
    });
  });

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove("active");
      }
    }
  });
};

// ==================== DASHBOARD ====================
const actualizarEstadisticas = () => {
  const hoy = new Date().toISOString().split("T")[0];

  const citasHoy = state.citas.filter((cita) => cita.fecha === hoy).length;
  document.getElementById("citasHoy").textContent = citasHoy;

  const mesActual = new Date().getMonth();
  const citasCompletadas = state.citas.filter((cita) => {
    const citaMes = new Date(cita.fecha).getMonth();
    return citaMes === mesActual && cita.estado === "completada";
  }).length;
  document.getElementById("citasCompletadas").textContent = citasCompletadas;

  document.getElementById("medicosActivos").textContent = state.medicos.length;

  const citasPendientes = state.citas.filter(
    (cita) => cita.estado === "pendiente"
  ).length;
  document.getElementById("citasPendientes").textContent = citasPendientes;

  actualizarProximasCitas();
};

const actualizarProximasCitas = () => {
  const container = document.getElementById("proximasCitas");
  const hoy = new Date();

  const proximasCitas = state.citas
    .filter((cita) => {
      const fechaCita = new Date(cita.fecha);
      return fechaCita >= hoy && cita.estado !== "cancelada";
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 5);

  if (proximasCitas.length === 0) {
    container.innerHTML = '<p class="empty-state">No hay citas próximas</p>';
    return;
  }

  container.innerHTML = proximasCitas
    .map((cita) => {
      const medico = state.medicos.find((m) => m.id === cita.medicoId);
      return `
        <div class="appointment-item">stu
            <h4>${cita.pacienteNombre}</h4>
            <p>Dr/a. ${medico ? medico.nombre : "N/A"} - ${formatearFecha(cita.fecha)} a las ${formatearHora(cita.hora)}</p>
        </div>
      `;
    })
    .join("");
};

// ==================== GESTIÓN DE MÉDICOS ====================
const abrirModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

window.cerrarModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
    if (modalId === "modalCita") {
      document.getElementById("formCita").reset();
      state.citaEditando = null;
    } else if (modalId === "modalMedico") {
      document.getElementById("formMedico").reset();
      state.medicoEditando = null;
    }
  }
};

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
    document.body.style.overflow = "auto";
  }
});

const cargarMedicosEnSelect = () => {
  const select = document.getElementById("medicoSelect");
  select.innerHTML = '<option value="">Seleccione un médico</option>';
  state.medicos.forEach((medico) => {
    const option = document.createElement("option");
    option.value = medico.id;
    option.textContent = `${medico.nombre} - ${medico.especialidad}`;
    select.appendChild(option);
  });
};

const renderizarMedicos = () => {
  const grid = document.getElementById("gridMedicos");
  if (state.medicos.length === 0) {
    grid.innerHTML =
      '<div class="empty-state">No hay médicos registrados</div>';
    return;
  }

  grid.innerHTML = state.medicos
    .map(
      (medico) => `
      <div class="doctor-card">
          <h4>${medico.nombre}</h4>
          <p class="specialty">${medico.especialidad}</p>
          <p class="info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; display: inline;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              ${medico.telefono}
          </p>
          <p class="info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; display: inline;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              ${medico.email}
          </p>
          <p class="info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; display: inline;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Lic. ${medico.licencia}
          </p>
          <p class="info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; display: inline;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ${medico.horario}
          </p>
          <p class="info">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline;">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M17 2a5 5 0 0 1 5 5v10a5 5 0 0 1 -5 5h-10a5 5 0 0 1 -5 -5v-10a5 5 0 0 1 5 -5zm-9 8a1 1 0 0 0 -1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0 -1 -1m6 0a3 3 0 0 0 -1.168 .236l-.125 .057a1 1 0 0 0 -1.707 .707v5a1 1 0 0 0 2 0v-3a1 1 0 0 1 2 0v3a1 1 0 0 0 2 0v-3a3 3 0 0 0 -3 -3m-6 -3a1 1 0 0 0 -.993 .883l-.007 .127a1 1 0 0 0 1.993 .117l.007 -.127a1 1 0 0 0 -1 -1" />
              </svg>
              ${medico.linkedin}
          </p>
          <div class="actions">
              <button class="btn btn-success" onclick="editarMedico('${medico.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
              </button>
              <button class="btn btn-danger" onclick="eliminarMedico('${medico.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
              </button>
          </div>
      </div>
    `
    )
    .join("");
};

const inicializarFormularioMedico = () => {
  const form = document.getElementById("formMedico");
  const btnNuevoMedico = document.getElementById("btnNuevoMedico");

  btnNuevoMedico.addEventListener("click", () => {
    form.reset();
    state.medicoEditando = null;
    document.getElementById("modalMedicoTitulo").textContent = "Nuevo Médico";
    abrirModal("modalMedico");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const medico = {
      id: state.medicoEditando || generarId(),
      nombre: document.getElementById("medicoNombre").value,
      especialidad: document.getElementById("medicoEspecialidad").value,
      telefono: document.getElementById("medicoTelefono").value,
      email: document.getElementById("medicoEmail").value,
      licencia: document.getElementById("medicoLicencia").value,
      horario: document.getElementById("medicoHorario").value,
      linkedin: document.getElementById("medicoLinkedin").value,
    };

    if (state.medicoEditando) {
      const index = state.medicos.findIndex(
        (m) => m.id === state.medicoEditando
      );
      state.medicos[index] = medico;
      state.medicoEditando = null;
    } else {
      state.medicos.push(medico);
    }

    guardarEnLocalStorage();
    cargarMedicosEnSelect();
    renderizarMedicos();
    actualizarEstadisticas();
    form.reset();
    cerrarModal("modalMedico");
    mostrarNotificacion("Médico guardado exitosamente", "success");
  });

  form.addEventListener("reset", () => {
    state.medicoEditando = null;
    cerrarModal("modalMedico");
  });
};

window.editarMedico = (id) => {
  const medico = state.medicos.find((m) => m.id === id);
  if (!medico) return;

  state.medicoEditando = id;
  document.getElementById("medicoNombre").value = medico.nombre;
  document.getElementById("medicoEspecialidad").value = medico.especialidad;
  document.getElementById("medicoTelefono").value = medico.telefono;
  document.getElementById("medicoEmail").value = medico.email;
  document.getElementById("medicoLicencia").value = medico.licencia;
  document.getElementById("medicoHorario").value = medico.horario;
  document.getElementById("medicoLinkedin").value = medico.linkedin;
  document.getElementById("modalMedicoTitulo").textContent = "Editar Médico";
  abrirModal("modalMedico");
};

window.eliminarMedico = (id) => {
  if (!confirm("¿Está seguro de eliminar este médico?")) return;

  const tieneCitas = state.citas.some((cita) => cita.medicoId === id);
  if (tieneCitas) {
    alert("No se puede eliminar un médico con citas asignadas");
    return;
  }

  state.medicos = state.medicos.filter((m) => m.id !== id);
  guardarEnLocalStorage();
  cargarMedicosEnSelect();
  renderizarMedicos();
  actualizarEstadisticas();
  mostrarNotificacion("Médico eliminado exitosamente", "success");
};

// ==================== GESTIÓN DE CITAS ====================
const renderizarCitas = () => {
  const tbody = document.getElementById("tablaCitas");
  if (state.citas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No hay citas registradas</td></tr>';
    return;
  }

  const citasOrdenadas = [...state.citas].sort((a, b) => {
    const fechaA = new Date(a.fecha + " " + a.hora);
    const fechaB = new Date(b.fecha + " " + b.hora);
    return fechaB - fechaA;
  });

  tbody.innerHTML = citasOrdenadas
    .map((cita) => {
      const medico = state.medicos.find((m) => m.id === cita.medicoId);
      return `
        <tr>
            <td>${cita.pacienteNombre}</td>
            <td>Dr/a. ${medico ? medico.nombre : "N/A"}</td>
            <td>${formatearFecha(cita.fecha)}</td>
            <td>${formatearHora(cita.hora)}</td>
            <td><span class="status-badge status-${cita.estado}">${cita.estado}</span></td>
            <td>
                <div class="actions">
                    <button class="btn btn-success" onclick="editarCita('${cita.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="btn btn-success" onclick="cambiarEstadoCita('${cita.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button class="btn btn-danger" onclick="eliminarCita('${cita.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
      `;
    })
    .join("");
};

const inicializarFormularioCita = () => {
  const form = document.getElementById("formCita");
  const btnNuevaCita = document.getElementById("btnNuevaCita");

  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fechaCita").setAttribute("min", hoy);

  btnNuevaCita.addEventListener("click", () => {
    form.reset();
    state.citaEditando = null;
    document.getElementById("modalCitaTitulo").textContent = "Nueva Cita";
    abrirModal("modalCita");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cita = {
      id: state.citaEditando || generarId(),
      pacienteNombre: document.getElementById("pacienteNombre").value,
      pacienteTelefono: document.getElementById("pacienteTelefono").value,
      medicoId: document.getElementById("medicoSelect").value,
      fecha: document.getElementById("fechaCita").value,
      hora: document.getElementById("horaCita").value,
      motivo: document.getElementById("motivoConsulta").value,
      estado: state.citaEditando
        ? state.citas.find((c) => c.id === state.citaEditando).estado
        : "pendiente",
    };

    if (!cita.medicoId) {
      mostrarNotificacion("Por favor seleccione un médico", "error");
      return;
    }

    // Validación de duplicado: mismo médico, misma fecha, misma hora
    const duplicado = state.citas.some(
      (c) =>
        c.medicoId === cita.medicoId &&
        c.fecha === cita.fecha &&
        c.hora === cita.hora &&
        c.id !== cita.id // excluye la misma cita al editar
    );

    if (duplicado) {
      mostrarNotificacion(
        "Ya existe una cita con ese médico en esa fecha y hora",
        "error"
      );
      return;
    }

    if (state.citaEditando) {
      const index = state.citas.findIndex((c) => c.id === state.citaEditando);
      state.citas[index] = cita;
      state.citaEditando = null;
    } else {
      state.citas.push(cita);
    }

    guardarEnLocalStorage();
    renderizarCitas();
    actualizarEstadisticas();
    form.reset();
    cerrarModal("modalCita");
    mostrarNotificacion("Cita guardada exitosamente", "success");
  });

  form.addEventListener("reset", () => {
    state.citaEditando = null;
    cerrarModal("modalCita");
  });
};

window.editarCita = (id) => {
  const cita = state.citas.find((c) => c.id === id);
  if (!cita) return;

  state.citaEditando = id;
  document.getElementById("pacienteNombre").value = cita.pacienteNombre;
  document.getElementById("pacienteTelefono").value = cita.pacienteTelefono;
  document.getElementById("medicoSelect").value = cita.medicoId;
  document.getElementById("fechaCita").value = cita.fecha;
  document.getElementById("horaCita").value = cita.hora;
  document.getElementById("motivoConsulta").value = cita.motivo;
  document.getElementById("modalCitaTitulo").textContent = "Editar Cita";
  abrirModal("modalCita");
};

window.cambiarEstadoCita = (id) => {
  const cita = state.citas.find((c) => c.id === id);
  if (!cita) return;

  const estados = ["pendiente", "confirmada", "completada", "cancelada"];
  const estadoActual = estados.indexOf(cita.estado);
  const siguienteEstado = estados[(estadoActual + 1) % estados.length];
  cita.estado = siguienteEstado;

  guardarEnLocalStorage();
  renderizarCitas();
  actualizarEstadisticas();
  mostrarNotificacion(`Estado actualizado a: ${siguienteEstado}`, "success");
};

window.eliminarCita = (id) => {
  if (!confirm("¿Está seguro de eliminar esta cita?")) return;

  state.citas = state.citas.filter((c) => c.id !== id);
  guardarEnLocalStorage();
  renderizarCitas();
  actualizarEstadisticas();
  mostrarNotificacion("Cita eliminada exitosamente", "success");
};

// ==================== NOTIFICACIONES ====================
const mostrarNotificacion = (mensaje, tipo = "success") => {
  const notificacion = document.createElement("div");
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.textContent = mensaje;
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${tipo === "success" ? "#10b981" : "#ef4444"};
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
  `;
  document.body.appendChild(notificacion);

  setTimeout(() => {
    notificacion.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => {
      document.body.removeChild(notificacion);
    }, 300);
  }, 3000);
};

const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0);    opacity: 1; }
    to   { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ==================== INICIALIZACIÓN ====================
document.addEventListener("DOMContentLoaded", () => {
  inicializarNavegacion();
  cargarMedicosEnSelect();
  renderizarMedicos();
  renderizarCitas();
  actualizarEstadisticas();
  inicializarFormularioMedico();
  inicializarFormularioCita();
  console.log("Sistema inicializado correctamente");
});