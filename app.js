// ========== Configuración de Supabase ==========
const SUPABASE_URL      = 'https://yahmwegfxskynhxepplk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zVQyIDj8cvXw8b8Aq1uYGw_VIkF8MMW';
const { createClient }  = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WHATSAPP_NUMERO = '5493476622912';

document.addEventListener('DOMContentLoaded', () => {

    // ========== Modal ==========
    const btnComprar   = document.getElementById('btn-comprar');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnCerrar    = document.getElementById('btn-cerrar-modal');
    const formCompra   = document.getElementById('form-compra');

    if(btnComprar) {
        btnComprar.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            formCompra.reset();
            setTimeout(() => document.getElementById('nombre').focus(), 350);
        });
    }

    const cerrarModal = () => {
        if(modalOverlay) modalOverlay.classList.remove('active');
    }

    if(btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
    if(modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) cerrarModal();
        });
    }

    // ========== Formulario de Compra ==========
    if(formCompra) {
        formCompra.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página se recargue

            const nombre = document.getElementById('nombre').value.trim();
            const carton = document.getElementById('carton').value.trim();

            if (!nombre || !carton) return;

            try {
                // 1. Verificar si el cartón ya está vendido en Supabase
                const { data: cartones, error: errorBusqueda } = await db
                    .from('ventas')
                    .select('*')
                    .eq('numero_carton', carton)
                    .eq('id_sorteo', 1);

                if (errorBusqueda) throw errorBusqueda;

                if (cartones && cartones.length > 0) {
                    alert('¡Uy! Ese cartón ya está vendido o reservado. Por favor, elegí otro.');
                    return; // Frenamos todo acá
                }

                // 2. Insertar al nuevo cliente
                const { data: clienteData, error: clienteError } = await db
                    .from('clientes')
                    .insert([{ nombre: nombre }])
                    .select();

                if (clienteError) throw clienteError;

                const id_cliente = clienteData[0].id_cliente;

                // 3. Insertar la venta
                const { error: ventaError } = await db.from('ventas').insert([{
                    id_cliente:    id_cliente,
                    id_sorteo:     1,
                    numero_carton: carton,
                    estado:        'Pendiente'
                }]);

                if (ventaError) throw ventaError;

                // 4. Cerrar la ventanita y limpiar el formulario
                cerrarModal();
                formCompra.reset();

                // 5. Abrir el WhatsApp con el mensaje armado
                const mensaje = `Hola, mi nombre es ${nombre}. Quiero comprar el cartón ${carton} del Super Bingo del Pescador. ¿Qué números te quedan disponibles?`;
                window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');

            } catch (error) {
                console.error('Error en el proceso de compra:', error);
                alert('Ocurrió un error al conectar con la base de datos. Por favor, revisá tu conexión o la API Key e intentá de nuevo.');
            }
        });
    }

    // ========== Lightbox de Premios ==========
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

    // ========== Tecla Escape ==========
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && lightbox.classList.contains('active')) {
                cerrarLightbox();
            } else if (modalOverlay && modalOverlay.classList.contains('active')) {
                cerrarModal();
            }
        }
    });
});