import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Aviso de Privacidad — TuCobertura",
  description: "Aviso de privacidad integral conforme a la LFPDPPP de TuCobertura.",
}

const VERDE = "#0F6E56"

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar mínimo */}
      <nav className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: VERDE }}>+</div>
            <span className="font-bold text-gray-800">TuCobertura</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aviso de Privacidad Integral</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: agosto de 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">I. Identidad y domicilio del Responsable</h2>
            <p>
              TuCobertura (en adelante "el Responsable") es responsable del tratamiento de sus datos personales.
              Domicilio: Ciudad de México, México. Contacto de privacidad:{" "}
              <a href="mailto:privacidad@tucobertura.mx" style={{ color: VERDE }}>privacidad@tucobertura.mx</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">II. Datos personales que se recaban</h2>
            <p>El Responsable podrá recabar las siguientes categorías de datos personales:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Identificación y contacto:</strong> nombre, apellidos, teléfono, correo electrónico y estado/ciudad.</li>
              <li><strong>Datos de salud (datos sensibles):</strong> diagnóstico, padecimiento, procedimiento quirúrgico de interés y condición médica general.</li>
              <li><strong>Datos patrimoniales:</strong> aseguradora contratada y número de póliza de seguro de gastos médicos mayores.</li>
            </ul>
            <p className="mt-2">
              Los datos de salud constituyen datos personales sensibles conforme a la{" "}
              <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em> (LFPDPPP)
              y serán tratados con especial diligencia y las medidas de seguridad reforzadas previstas en la ley.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">III. Finalidades del tratamiento</h2>
            <p><strong>Finalidades primarias (necesarias para la relación jurídica):</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Contactarle para brindarle asesoría sobre la cobertura de su póliza GMM respecto al procedimiento quirúrgico de interés.</li>
              <li>Gestionar y tramitar la autorización de cobertura ante su aseguradora.</li>
              <li>Coordinar el ingreso hospitalario, el médico tratante y el proceso de alta administrativa.</li>
              <li>Dar seguimiento a su expediente médico-administrativo durante el proceso.</li>
            </ul>
            <p className="mt-3"><strong>Finalidades secundarias (opcionales):</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Envío de comunicaciones informativas sobre procedimientos y coberturas de seguros.</li>
              <li>Evaluación interna de calidad del servicio.</li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">
              Si no desea que sus datos sean tratados para las finalidades secundarias, puede manifestarlo enviando
              un correo a <a href="mailto:privacidad@tucobertura.mx" style={{ color: VERDE }}>privacidad@tucobertura.mx</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">IV. Transferencias de datos personales</h2>
            <p>
              Sus datos podrán ser transferidos a las siguientes categorías de terceros, exclusivamente para
              las finalidades descritas en el presente aviso:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Aseguradoras y compañías de seguros:</strong> para gestionar la autorización y cobertura del procedimiento quirúrgico.</li>
              <li><strong>Hospitales y clínicas:</strong> para la programación del ingreso y atención médica.</li>
              <li><strong>Médicos especialistas:</strong> para la coordinación de la atención quirúrgica.</li>
            </ul>
            <p className="mt-2">
              Dichas transferencias son necesarias para la relación jurídica y no requieren su consentimiento expreso
              conforme al artículo 37 de la LFPDPPP. No se realizarán otras transferencias sin su previo consentimiento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">V. Consentimiento para datos sensibles</h2>
            <p>
              De conformidad con el artículo 9 de la LFPDPPP, el tratamiento de sus datos de salud requiere
              su consentimiento expreso. Al marcar la casilla de aceptación en el formulario de esta plataforma,
              usted otorga su consentimiento expreso y por escrito para el tratamiento de sus datos sensibles
              conforme a las finalidades primarias descritas en el presente aviso.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">VI. Medidas de seguridad</h2>
            <p>
              El Responsable ha implementado medidas de seguridad administrativas, técnicas y físicas para
              proteger sus datos personales contra daño, pérdida, alteración, destrucción o uso, acceso o
              tratamiento no autorizados. Los datos de salud son almacenados con cifrado en reposo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">VII. Derechos ARCO y revocación del consentimiento</h2>
            <p>
              Usted tiene derecho a <strong>Acceder</strong> a sus datos personales, <strong>Rectificarlos</strong>,{" "}
              <strong>Cancelarlos</strong> u <strong>Oponerse</strong> a su tratamiento (derechos ARCO),
              así como a revocar el consentimiento otorgado.
            </p>
            <p className="mt-2">
              Para ejercer cualquiera de estos derechos, envíe su solicitud a:{" "}
              <a href="mailto:privacidad@tucobertura.mx" style={{ color: VERDE }}>privacidad@tucobertura.mx</a>,
              indicando su nombre completo, datos de contacto y el derecho que desea ejercer.
              Recibirá respuesta en un plazo máximo de 20 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">VIII. Cambios al aviso de privacidad</h2>
            <p>
              El presente aviso podrá ser modificado. Cualquier cambio será publicado en esta página.
              Le recomendamos consultarla periódicamente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">IX. INAI</h2>
            <p>
              Si considera que su derecho a la protección de datos personales ha sido lesionado, puede
              presentar una queja ante el Instituto Nacional de Transparencia, Acceso a la Información
              y Protección de Datos Personales (INAI): <a href="https://www.inai.org.mx" style={{ color: VERDE }} target="_blank" rel="noreferrer">www.inai.org.mx</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link href="/" className="text-sm font-medium" style={{ color: VERDE }}>
            ← Regresar a TuCobertura
          </Link>
        </div>
      </main>
    </div>
  )
}
