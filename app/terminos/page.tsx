import Link from "next/link"
import type { Metadata } from "next"
import { Logo } from "@/components/brand/Logo"

export const metadata: Metadata = {
  title: "Términos y Condiciones — iHelp Médica",
  description: "Términos y condiciones del servicio de iHelp Médica.",
}

const VERDE = "#0F6E56"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar mínimo */}
      <nav className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link href="/" className="hover:opacity-80 transition-opacity" aria-label="iHelp Médica — inicio">
            <Logo size={32} textClass="text-lg" />
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: septiembre de 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">1. Descripción del servicio</h2>
            <p>
              iHelp Médica (en adelante &ldquo;el Servicio&rdquo;) opera como administrador tercero (TPA) para hospitales,
              médicos, aseguradoras y empresas: gestión de convenios, administración de casos, dictamen central
              y desarrollo comercial. A los pacientes que lo solicitan a través de este sitio, el Servicio les
              ofrece exclusivamente contacto y canalización con médicos y hospitales de su red.
            </p>
            <p className="mt-2 font-medium">
              iHelp Médica <strong>no es</strong> una compañía de seguros ni un agente de seguros, no vende ni
              intermedia pólizas, y no asume responsabilidad alguna por las decisiones de cobertura de las aseguradoras.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">2. Servicios a instituciones</h2>
            <p>
              Los servicios a hospitales, médicos, aseguradoras y empresas se contratan mediante propuesta
              comercial y contrato específicos, cuyas condiciones prevalecen sobre estos Términos en lo que
              resulten aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">3. Alcance para pacientes</h2>
            <p>Para el paciente, el Servicio se limita a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Contactarle con base en los datos que proporcione en el formulario.</li>
              <li>Canalizarle con médicos y hospitales de la red de iHelp Médica según la especialidad o procedimiento de su interés.</li>
            </ul>
            <p className="mt-2">El Servicio <strong>no incluye:</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Asesoría, revisión ni interpretación de pólizas de seguro.</li>
              <li>Gestión o seguimiento de trámites, autorizaciones o reembolsos ante aseguradoras.</li>
              <li>Descuentos, apoyos o pagos de deducible o coaseguro.</li>
              <li>Exención, reducción o sustitución de depósitos en garantía hospitalarios.</li>
              <li>Garantía de aprobación de cobertura por parte de ninguna aseguradora.</li>
              <li>Diagnóstico médico ni ejercicio de la medicina.</li>
              <li>Representación legal ante aseguradoras o autoridades.</li>
            </ul>
            <p className="mt-2">
              Las condiciones económicas de la atención médica las determinan el hospital y el médico tratante,
              y las de la póliza, exclusivamente la aseguradora.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">4. Obligaciones del usuario</h2>
            <p>Al utilizar el Servicio, el usuario se obliga a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Proporcionar información veraz, completa y actualizada.</li>
              <li>Informar oportunamente cualquier cambio en sus datos de contacto.</li>
              <li>No utilizar el Servicio para fines fraudulentos o ilegales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">5. Limitación de responsabilidad</h2>
            <p>
              iHelp Médica no garantiza que ninguna aseguradora apruebe la cobertura de un procedimiento.
              La decisión de cobertura es facultad exclusiva de la aseguradora conforme a los términos
              de la póliza del paciente. En ningún caso iHelp Médica será responsable por daños directos,
              indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">6. Privacidad y datos personales</h2>
            <p>
              El tratamiento de los datos personales del usuario se rige por el{" "}
              <Link href="/privacidad" style={{ color: VERDE }} className="underline">Aviso de Privacidad</Link>{" "}
              de iHelp Médica, que forma parte integrante de estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">7. Propiedad intelectual</h2>
            <p>
              Todos los contenidos, marcas, logotipos, textos y elementos visuales de iHelp Médica son
              propiedad exclusiva del Responsable y están protegidos por la legislación mexicana de propiedad
              intelectual. Su reproducción total o parcial sin autorización expresa está prohibida.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">8. Modificaciones</h2>
            <p>
              iHelp Médica se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios
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
            ← Regresar a iHelp Médica
          </Link>
        </div>
      </main>
    </div>
  )
}
