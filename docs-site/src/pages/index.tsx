import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

export default function Home(): ReactNode {
  return (
    <Layout
      title="Radar.ai Documentation"
      description="Hub de documentacao tecnica e de produto do Radar.ai">
      <main className="container margin-vert--xl">
        <h1>Radar.ai Docs</h1>
        <p>Portal de documentacao para acompanhar produto, arquitetura e execucao.</p>

        <div className="row">
          <div className="col col--6">
            <div className="card padding--lg margin-bottom--md">
              <h2>Estado Atual vs Roadmap</h2>
              <p>
                Visao unica do que esta implementado hoje e do que esta planejado para as proximas fases.
              </p>
              <Link className="button button--primary" to="/docs/STATUS_AND_ROADMAP">
                Abrir Status
              </Link>
            </div>
          </div>

          <div className="col col--6">
            <div className="card padding--lg margin-bottom--md">
              <h2>Arquitetura de Documentos</h2>
              <p>
                Estrutura recomendada para manter docs atualizadas conforme o projeto evolui.
              </p>
              <Link className="button button--secondary" to="/docs">
                Abrir Hub
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
