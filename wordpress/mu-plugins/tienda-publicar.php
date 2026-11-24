<?php
/**
 * Plugin Name: Tienda – Publicar el sitio al guardar
 * Description: Cuando se publica, edita, despublica o borra un producto o un contenido de ACF/CPT UI (p. ej. testimonios), le pide a GitHub que vuelva a compilar el sitio en Astro. Junta los cambios de un minuto en un solo aviso. Configuración en wp-config.php. Para quitarlo, borre este archivo (el sitio igual se recompila una vez al día).
 *
 * En wp-config.php (antes de «That's all, stop editing!»):
 *   define( 'TIENDA_GITHUB_REPO', 'usuario/mi-tienda' );
 *   define( 'TIENDA_GITHUB_TOKEN', 'github_pat_…' );   // fine-grained, SOLO ese repo, permiso «Contents: Read and write»
 *   // Opcional: tipos que disparan el build (por defecto productos y testimonios).
 *   // define( 'TIENDA_TIPOS_PUBLICAR', 'product,testimonios,sucursales' );
 *
 * El token vive solo en el servidor: nunca llega al navegador ni al sitio en Astro.
 */

defined( 'ABSPATH' ) || exit;

const TIENDA_PUBLICAR_EVENTO = 'tienda_publicar_aviso';
const TIENDA_PUBLICAR_ESTADO = 'tienda_publicar_ultimo';

function tienda_publicar_configurado(): bool {
	return defined( 'TIENDA_GITHUB_REPO' ) && defined( 'TIENDA_GITHUB_TOKEN' )
		&& preg_match( '#^[\w.-]+/[\w.-]+$#', (string) TIENDA_GITHUB_REPO )
		&& '' !== (string) TIENDA_GITHUB_TOKEN;
}

function tienda_publicar_tipos(): array {
	$tipos = defined( 'TIENDA_TIPOS_PUBLICAR' ) ? (string) TIENDA_TIPOS_PUBLICAR : 'product,testimonios';
	return array_filter( array_map( 'trim', explode( ',', $tipos ) ) );
}

/** Programa un aviso dentro de un minuto (si ya hay uno pendiente, no agrega otro). */
function tienda_publicar_programar(): void {
	if ( tienda_publicar_configurado() && ! wp_next_scheduled( TIENDA_PUBLICAR_EVENTO ) ) {
		wp_schedule_single_event( time() + 60, TIENDA_PUBLICAR_EVENTO );
	}
}

// Solo cuando cambia algo que se ve en el sitio: lo publicado, o lo que deja de estar publicado.
add_action(
	'transition_post_status',
	function ( $nuevo, $viejo, $post ) {
		if ( ! in_array( $post->post_type, tienda_publicar_tipos(), true ) ) {
			return;
		}
		if ( 'publish' !== $nuevo && 'publish' !== $viejo ) {
			return; // borradores y revisiones: el sitio no cambia
		}
		if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
			return;
		}
		tienda_publicar_programar();
	},
	10,
	3
);

// Precio o stock cambiados desde la lista de productos, la edición rápida o un pedido.
add_action( 'woocommerce_product_set_stock_status', 'tienda_publicar_programar' );
add_action( 'woocommerce_update_product', 'tienda_publicar_programar' );

// El aviso: POST /repos/{repo}/dispatches con el tipo que escucha el workflow.
add_action(
	TIENDA_PUBLICAR_EVENTO,
	function () {
		if ( ! tienda_publicar_configurado() ) {
			return;
		}
		$respuesta = wp_remote_post(
			'https://api.github.com/repos/' . TIENDA_GITHUB_REPO . '/dispatches',
			array(
				'timeout' => 15,
				'headers' => array(
					'Authorization'        => 'Bearer ' . TIENDA_GITHUB_TOKEN,
					'Accept'               => 'application/vnd.github+json',
					'X-GitHub-Api-Version' => '2022-11-28',
					'User-Agent'           => 'tienda-publicar',
				),
				'body'    => wp_json_encode( array( 'event_type' => 'tienda-actualizada' ) ),
			)
		);
		$codigo = is_wp_error( $respuesta ) ? 0 : (int) wp_remote_retrieve_response_code( $respuesta );
		update_option(
			TIENDA_PUBLICAR_ESTADO,
			array(
				'fecha'  => time(),
				'codigo' => $codigo,
				'error'  => is_wp_error( $respuesta ) ? $respuesta->get_error_message() : '',
			),
			false
		);
	}
);

// Aviso en el escritorio: falta configurar, o el último pedido a GitHub falló.
add_action(
	'admin_notices',
	function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( ! tienda_publicar_configurado() ) {
			echo '<div class="notice notice-info"><p><strong>Tienda (Astro):</strong> para que el sitio se actualice al guardar, defina <code>TIENDA_GITHUB_REPO</code> y <code>TIENDA_GITHUB_TOKEN</code> en <code>wp-config.php</code>. Mientras tanto, el sitio se actualiza una vez al día.</p></div>';
			return;
		}
		$ultimo = get_option( TIENDA_PUBLICAR_ESTADO );
		if ( is_array( $ultimo ) && 204 !== $ultimo['codigo'] ) {
			$motivo = array(
				0   => 'no se pudo conectar con GitHub',
				401 => 'el token no es válido o venció',
				403 => 'el token no tiene permiso «Contents: Read and write» en ese repositorio',
				404 => 'el repositorio no existe o el token no tiene acceso',
			);
			$texto = $motivo[ $ultimo['codigo'] ] ?? 'GitHub respondió ' . (int) $ultimo['codigo'];
			printf(
				'<div class="notice notice-error"><p><strong>Tienda (Astro):</strong> el último aviso para actualizar el sitio falló (%s, %s). Los cambios se verán en la actualización diaria.</p></div>',
				esc_html( $texto ),
				esc_html( wp_date( 'j M H:i', $ultimo['fecha'] ) )
			);
		}
	}
);
