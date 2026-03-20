const SUPABASE_URL      = 'https://yahmwegfxskynhxepplk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zVQyIDj8cvXw8b8Aq1uYGw_VIkF8MMW';
const { createClient }  = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHATSAPP_NUMERO = '5493476622912';

document.addEventListener('DOMContentLoaded', () => {

    const btnComprar   = document.getElementById('btn-comprar');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnCerrar    = document.getElementById('btn-cerrar-modal');
    const formCompra   = document.getElementById('form-compra');

    async function generarSugerencias(idSorteo) {
        const grid = document.getElementById('sugerencias-grid');
        if (!grid) return;
        
        grid.innerHTML = '<span style="color:#94a3b8; font-size:0.85rem;">Buscando inventario disponible...</span>';
        
        let stockTotal = [];
        try {
            const { data, error } = await db.from('cartones_disponibles').select('numero_carton').eq('id_sorteo', idSorteo);
            if (!error && data) {
                stockTotal = data.map(v => v.numero_carton);
            }
        } catch(err) {
            console.error('Error al traer stock:', err);
        }

        if (stockTotal.length === 0) {
             grid.innerHTML = '<span style="color:#f87171; font-size:0.85rem;">(No hay cartones cargados en stock)</span>';
             return;
        }

        let ocupados = new Set();
        try {
            const { data, error } = await db.from('ventas').select('numero_carton').eq('id_sorteo', idSorteo);
            if (!error && data) {
                ocupados = new Set(data.map(v => v.numero_carton));
            }
        } catch(err) {
            console.error('Error ventas:', err);
        }

        const libresReales = stockTotal.filter(num => !ocupados.has(num));

        if (libresReales.length === 0) {
            grid.innerHTML = '<span style="color:#fbbf24; font-size:0.85rem;">(Todos los cartones del inventario están vendidos)</span>';
            return;
        }

        grid.innerHTML = '';
        
        libresReales.sort((a,b) => a.localeCompare(b));

        libresReales.forEach(num => {
            const chip = document.createElement('div');
            chip.className = 'sugerencia-chip';
            chip.textContent = num;
            chip.addEventListener('click', () => {
                document.querySelectorAll('.sugerencia-chip.selected').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                document.getElementById('carton').value = num;
            });
            grid.appendChild(chip);
        });
    }

    const containerBingos = document.getElementById('bingos-activos');
    if (containerBingos) {
        async function cargarBingosIndex() {
            try {
                const { data: sorteos, error } = await db.from('sorteos').select('*').order('id_sorteo', { ascending: false });
                if (error) throw error;
                if (!sorteos || sorteos.length === 0) {
                    containerBingos.innerHTML = '<p style="text-align:center; color:#f87171; width:100%;">Aún no hay ningún Sorteo/Bingo activo cargado en el sistema.</p>';
                    return;
                }
                
                containerBingos.innerHTML = '';
                sorteos.forEach(s => {
                    const div = document.createElement('article');
                    div.className = 'card card--active card--featured';
                    
                    const fec = s.fecha_sorteo ? `Sortea: ${s.fecha_sorteo}` : 'Sorteo Activo';
                    div.innerHTML = `
                        <div class="card__cover">
                            <div style="background:var(--accent-blue); padding:30px 15px; text-align:center; border-radius:12px 12px 0 0; color:#0f172a; font-weight:900; font-size:1.4rem; text-shadow: 2px 2px 4px rgba(255,255,255,0.4); line-height: 1.3;">
                                🎉 ${s.nombre_bingo.toUpperCase()}
                            </div>
                        </div>
                        <p class="card__price" style="margin-top:20px;">$${s.precio_carton}</p>
                        <p class="card__desc" style="margin-bottom:20px; padding-left:20px; padding-right:20px;">${fec} — Seleccioná tu cartón ya mismo.</p>
                        
                        <button class="btn btn--buy" style="width:calc(100% - 40px); margin: 0 auto 20px auto; display:block;" onclick="abrirModalCompra(${s.id_sorteo}, '${s.nombre_bingo.replace(/'/g, "\\'")}')">
                            👆 Tocar acá para Comprar
                        </button>
                    `;
                    containerBingos.appendChild(div);
                });
            } catch (err) {
                containerBingos.innerHTML = '<p style="text-align:center; color:#f87171; width:100%;">Error de conexión. Refresca la página.</p>';
            }
        }
        cargarBingosIndex();
    }

    window.abrirModalCompra = function(idSorteo, nombreSorteo) {
        document.getElementById('id_sorteo_activo').value = idSorteo;
        document.getElementById('nombre_sorteo_activo').value = nombreSorteo;
        document.getElementById('modal-subtitle-bingo').textContent = nombreSorteo;
        
        modalOverlay.classList.add('active');
        formCompra.reset();
        
        const grid = document.getElementById('sugerencias-grid');
        if(grid) grid.innerHTML = '<span style="color:#94a3b8; font-size:0.85rem;">Cargando inventario de este sorteo...</span>';
        
        generarSugerencias(idSorteo);
        setTimeout(() => document.getElementById('nombre').focus(), 350);
    };

    const cerrarModal = () => {
        if(modalOverlay) modalOverlay.classList.remove('active');
    }

    if(btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
    if(modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) cerrarModal();
        });
    }

    const inputNombre = document.getElementById('nombre');
    if (inputNombre) {
        inputNombre.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }

    const inputDni = document.getElementById('dni');
    if (inputDni) {
        inputDni.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    const inputCarton = document.getElementById('carton');
    if (inputCarton) {
        inputCarton.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    if(formCompra) {
        formCompra.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const nombre = document.getElementById('nombre').value.trim();
            const dni    = document.getElementById('dni').value.trim();
            const carton = document.getElementById('carton').value.trim();

            if (!carton) {
                alert('¡Falta el paso final! Tocá uno de los cartones libres en la lista verde para seleccionarlo y continuar.');
                return;
            }

            if (!nombre || !dni) return;

            try {
                const idSorteo = document.getElementById('id_sorteo_activo').value;
                const nombreSorteo = document.getElementById('nombre_sorteo_activo').value;

                const { data: cartones, error: errorBusqueda } = await db
                    .from('ventas')
                    .select('*')
                    .eq('numero_carton', carton)
                    .eq('id_sorteo', idSorteo);

                if (errorBusqueda) throw errorBusqueda;

                if (cartones && cartones.length > 0) {
                    alert('¡Uy! Ese cartón ya fue reservado o vendido. Por favor, elegí otro.');
                    return; 
                }

                const { data: clienteData, error: clienteError } = await db
                    .from('clientes')
                    .insert([{ nombre: nombre, dni: dni }])
                    .select();

                if (clienteError) throw clienteError;

                const id_cliente = clienteData[0].id_cliente;

                const { error: ventaError } = await db.from('ventas').insert([{
                    id_cliente:    id_cliente,
                    id_sorteo:     idSorteo,
                    numero_carton: carton,
                    estado:        'Pendiente'
                }]);

                if (ventaError) throw ventaError;

                cerrarModal();
                formCompra.reset();

                const mensaje = `Hola, mi nombre es ${nombre} (DNI: ${dni}). Quiero comprar el cartón ${carton} de la campaña "${nombreSorteo}". ¿Me tomás la reserva?`;
                window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');

            } catch (error) {
                console.error('Error en el proceso de compra:', error);
                alert('Ocurrió un error al conectar con la base de datos. Por favor, revisá tu conexión o la API Key e intentá de nuevo.');
            }
        });
    }

    const lightbox      = document.getElementById('lightbox');
    const lightboxImg   = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    const cerrarLightbox = () => {
        if(lightbox) lightbox.classList.remove('active');
        setTimeout(() => { if(lightboxImg) lightboxImg.src = ''; }, 350);
    };

    document.querySelectorAll('.premios__item').forEach((item) => {
        item.addEventListener('click', () => {
            const img = item.querySelector('.premios__img');
            if (img && lightbox && lightboxImg) {
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt;
                lightbox.classList.add('active');
            }
        });
    });

    if(lightboxClose) lightboxClose.addEventListener('click', cerrarLightbox);
    if(lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) cerrarLightbox();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && lightbox.classList.contains('active')) {
                cerrarLightbox();
            } else if (modalOverlay && modalOverlay.classList.contains('active')) {
                cerrarModal();
            }
        }
    });

    const formContacto = document.getElementById('form-contacto');
    if (formContacto) {
        formContacto.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombreContacto = document.getElementById('contacto-nombre').value.trim();
            const mensajeContacto = document.getElementById('contacto-mensaje').value.trim();
            
            if (!nombreContacto || !mensajeContacto) return;
            
            const textoWs = `Hola, mi nombre es ${nombreContacto}. Te escribo con la siguiente consulta:\n\n${mensajeContacto}`;
            window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(textoWs)}`, '_blank');
            formContacto.reset();
        });
    }

});