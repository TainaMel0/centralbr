# Central Brasil — Portal de Certificados

Portal privado para cadastro de clientes, equipamentos e certificados de calibração em PDF.

## Uso

A primeira conta autenticada no Site privado é registrada como administradora. O Site deve permanecer restrito ao proprietário até que essa inicialização ocorra. O registro de administrador é permanente e não deve ser removido.

A administração cadastra clientes, equipamentos e os PDFs originais. Cada equipamento tem ID próprio; seus certificados anuais mantêm o mesmo vínculo. O número de série é único dentro de cada cliente.

A demonstração usa dados fictícios e PDFs marcados sem validade metrológica. Ela não grava documentos fictícios no banco e não se mistura aos cadastros reais.

A próxima calibração é uma programação definida pelo cliente. Não é uma data de validade atribuída automaticamente ao certificado. Ausência de data é mostrada explicitamente.

## Acesso

A autenticação usa a conta ChatGPT através dos mecanismos do Sites. A publicação atual é privada, restrita ao proprietário. Clientes externos só poderão entrar depois de uma alteração explicitamente autorizada da política de acesso do Site. Antes disso, inicialize a conta administradora abrindo o portal.

Os códigos gerados pela administração vinculam uma conta autenticada a uma empresa. São de uso único, duram 7 dias, têm seus hashes armazenados e não são enviados automaticamente. O acesso aos dados e a cada PDF é verificado no servidor. A remoção de um usuário também invalida os códigos que ele já utilizou.

## Dados

D1 guarda clientes, equipamentos, metadados dos certificados, acessos e convites. R2 guarda os PDFs. As consultas são preparadas e restringem a empresa para clientes. Escritas administrativas exigem a conta administradora e verificam origem. O limite por PDF é 10 MB.

Não há integração com Bling, SharePoint ou e-mail. Os arquivos são enviados manualmente. Não há certificação de conformidade, cálculo metrológico ou geração de certificados reais.

## Verificação

- Compilação TypeScript e build do Worker.
- `node tests/portal-contract.mjs`: contratos dos endpoints, validação de arquivos/datas, histórico, isolamento entre empresas, códigos e revogação, usando SQLite local e armazenamento temporário.
- Teste visual em navegador não solicitado e não executado neste ambiente.
- WebMCP: busca e abertura de histórico compartilham o estado da interface. A validação em contexto WebMCP compatível não estava disponível sob as permissões de preview desta sessão.

## Desenvolvimento

Preservar o pnpm e a integração Vinext / Cloudflare do projeto. Alterações de schema devem gerar migrações Drizzle novas. Não reescrever migrações aplicadas. Configuração de hospedagem: `.openai/hosting.json`.
