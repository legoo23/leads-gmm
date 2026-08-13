import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones — iHelp Medica",
  description: "Términos y condiciones del servicio de iHelp Medica.",
}

const VERDE = "#0F6E56"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar mínimo */}
      <nav className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: VERDE }}>+</div>
            <span className="font-bold text-gray-800">iHelp Medica</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: agosto de 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">1. Descripción del servicio</h2>
            <p>
              iHelp Medica (en adelante "el Servicio") es una plataforma de gestión y asesoría médico-administrativa
              que facilita la coordinación entre pacientes, aseguradoras de gastos médicos mayores (GMM),
              hospitales y médicos especialistas, con el fin de agilizar la autorización de cobertura y el
              ingreso hospitalario para procedimientos quirúrgicos.
            </p>
            <p className="mt-2 font-medium">
              iHelp Medica <strong>no es</strong> una compañía de seguros, no vende ni intermediaria pólizas,
              y no asume responsabilidad alguna por las decisiones de cobertura de las aseguradoras.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">2. Gratuidad del servicio de asesoría</h2>
            <p>
              La asesoría y gestión de autorización prestada directamente al paciente es gratuita.
              iHelp Medica obtiene su remuneración de convenios con prestadores de servicios médicos
              y hospitalarios, sin costo adicional para el paciente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">3. Alcance de la asesoría</h2>
            <p>La asesoría de iHelp Medica incluye:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Revisión preliminar de la póliza GMM del paciente.</li>
              <li>Gestión de la solicitud de autorización ante la aseguradora correspondiente.</li>
              <li>Coordinación del ingreso hospitalario sin depósito en garantía (sujeto a convenio con el hospital).</li>
              <li>Seguimiento del proceso de alta administrativa.</li>
            </ul>
            <p className="mt-2">La asesoría <strong>no incluye:</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Garantía de aprobación de cobertura por parte de la aseguradora.</li>
              <li>Diagnóstico médico ni ejercicio de la medicina.</li>
              <li>Representación legal ante aseguradoras o autoridades.</li>
              <li>Cobertura de gastos no cubiertos por la póliza del paciente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">4. Obligaciones del usuario</h2>
            <p>Al utilizar el Servicio, el usuario se obliga a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Proporcionar información veraz, completa y actualizada.</li>
              <li>Mantener vigente la póliza de seguro GMM durante el proceso.</li>
              <li>Informar oportunamente cualquier cambio en su situación médica o de seguro.</li>
              <li>No utilizar el Servicio para fines fraudulentos o ilegales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">5. Limitación de responsabilidad</h2>
            <p>
              iHelp Medica no garantiza que la aseguradora apruebe la cobertura de ningún procedimiento.
              La decisión de cobertura es facultad exclusiva de la aseguradora conforme a los términos
              de la póliza del paciente. En ningún caso iHelp Medica será responsable por daños directos,
              indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">6. Privacidad y datos personales</h2>
            <p>
              El tratamiento de los datos personales del usuario se rige por el{" "}
              <Link href="/privacidad" style={{ color: VERDE }} className="underline">Aviso de Privacidad</Link>{" "}
              de iHelp Medica, que forma parte integrante de estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">7. Propiedad intelectual</h2>
            <p>
              Todos los contenidos, marcas, logotipos, textos y elementos visuales de iHelp Medica son
              propiedad exclusiva del Responsable y están protegidos por la legislación mexicana de propiedad
              intelectual. Su reproducción total o parcial sin autorización expresa está prohibida.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">8. Modificaciones</h2>
            <p>
              iHelp Medica se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios
              serán publicados en esta página con la fecha de actualización. El uso continuado del Servicio
              implica la aceptación de los términos vigentes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">9. Ley aplicable y jurisdicción</h2>
            <p>
              Los presentes Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier
              controversia, las partes se someten expresamente a la jurisdicción de los tribunales competentes
              de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">10. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos Términos:{" "}
              <a href="mailto:hola@ihelpmedica.mx" style={{ color: VERDE }}>hola@ihelpmedica.mx</a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link href="/" className="text-sm font-medium" style={{ color: VERDE }}>
            ← Regresar a iHelp Medica
          </Link>
        </div>
      </main>
    </div>
  )
}
