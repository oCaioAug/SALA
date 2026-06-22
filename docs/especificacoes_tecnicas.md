# Especificações Técnicas do Sistema SALA

Este documento apresenta as especificações técnicas necessárias para o funcionamento do sistema **SALA (Sistema de Gerenciamento de Salas)**. Para facilitar a compreensão e o planejamento do projeto, as especificações estão divididas entre **Requisitos Mínimos** (o patamar básico para funcionamento) e **Requisitos Recomendados** (configuração ideal para melhor performance e estabilidade).

As especificações são divididas em três âmbitos:
1. **Ambiente de Desenvolvimento e Execução Local** (Máquina do desenvolvedor)
2. **Infraestrutura de Produção** (Servidores e serviços de nuvem)
3. **Dispositivos do Usuário Final** (Acesso dos clientes e administradores via navegador)

---

## 1. Ambiente de Desenvolvimento e Execução Local

Esta seção especifica o hardware e o software necessários para que um desenvolvedor possa clonar o repositório, executar os servidores locais (frontend Next.js e API REST) e rodar o banco de dados local via contêineres Docker.

### Especificações de Hardware (Local)

| Recurso | Requisitos Mínimos | Requisitos Recomendados |
| :--- | :--- | :--- |
| **Processador (CPU)** | Intel Core i3 / AMD Ryzen 3 (2 cores físicos) | Intel Core i5/i7, AMD Ryzen 5/7 ou Apple Silicon M1/M2/M3 (4+ cores físicos) |
| **Memória RAM** | 8 GB | 16 GB ou superior |
| **Armazenamento** | 5 GB de espaço livre em HDD | 10 GB de espaço livre em SSD NVMe / SATA |
| **Arquitetura** | 64 bits (x64 ou ARM64) | 64 bits (x64 ou ARM64) |

> [!NOTE]  
> A recomendação de 16 GB de RAM garante que o desenvolvedor possa executar simultaneamente o contêiner Docker do PostgreSQL, o servidor local do Next.js (em modo de desenvolvimento com hot-reloading), a IDE (como VS Code ou WebStorm) e abas de teste do navegador sem perda de performance.

### Especificações de Software (Local)

| Software | Requisitos Mínimos | Requisitos Recomendados |
| :--- | :--- | :--- |
| **Sistema Operacional** | Windows 10 (64-bit), macOS Catalina (10.15) ou Linux (Ubuntu 20.04 LTS) | Windows 11 (64-bit) com WSL2, macOS Sonoma/Sequoia ou Linux (Ubuntu 22.04 LTS+) |
| **Ambiente de Execução** | Node.js v18.x LTS | Node.js v20.x LTS ou superior |
| **Gerenciador de Pacotes**| npm v9.x | npm v10.x ou Yarn/pnpm |
| **Containerização** | Docker v20.x + Docker Compose v2.x | Docker Desktop (última versão estável) |
| **Controle de Versão** | Git v2.30+ | Git (última versão estável) |
| **IDE / Editor** | Editor de texto simples (ex: VS Code básico) | VS Code com extensões recomendadas (Prisma, Tailwind CSS, ESLint, TypeScript) |

---

## 2. Infraestrutura de Produção e Nuvem

Para implantação em ambiente produtivo real, o sistema adota uma arquitetura baseada em nuvem com hospedagem serverless/gerenciada, banco de dados relacional e integrações externas.

### Hospedagem e Servidores

| Componente | Requisitos Mínimos (Escala Inicial) | Requisitos Recomendados (Escala Comercial) |
| :--- | :--- | :--- |
| **Hospedagem Web (Next.js)** | Provedor Serverless (ex: Vercel - Plano Hobby, Netlify) ou VPS simples (1 vCPU, 1 GB RAM, Ex: AWS EC2 t3.micro) | Provedor Serverless (Vercel - Plano Pro) ou VPS dedicada (2 vCPUs, 4 GB RAM, Ex: AWS EC2 t3.medium) |
| **Banco de Dados (PostgreSQL)** | PostgreSQL 15+ compartilhado (ex: Neon Free Tier, Render PostgreSQL Free) | PostgreSQL 15+ gerenciado (ex: Neon Pro, AWS RDS PostgreSQL com backup diário automático, 2 vCPUs e 4 GB RAM dedicada) |
| **Armazenamento de Imagens** | Cloudinary (Plano Free - 25 Credits/mês) | Cloudinary (Plano Premium) ou AWS S3 integrado com CDN (Amazon CloudFront) |

### Integrações e APIs Externas

Para o funcionamento pleno de todas as funcionalidades de negócio do sistema SALA:
- **Autenticação:** Credenciais de API do Google Cloud Console ativas para suporte ao Google OAuth 2.0 (NextAuth).
- **Sincronização de Calendário:** Acesso habilitado à API do Google Calendar com escopos de leitura/escrita para sincronização das reservas do usuário.
- **Rede / HTTPS:** É obrigatória a utilização de certificados SSL/TLS (HTTPS) em produção, sendo um pré-requisito técnico para o funcionamento seguro do NextAuth.

---

## 3. Dispositivos do Usuário Final

As especificações abaixo garantem que os usuários (alunos, professores, coordenadores e administradores) possam acessar a plataforma web com boa fluidez e responsividade.

### Requisitos para Acesso à Plataforma Web

| Recurso | Requisitos Mínimos | Requisitos Recomendados |
| :--- | :--- | :--- |
| **Dispositivos** | Computador (Desktop/Notebook), Tablet ou Smartphone | Computador Desktop ou Notebook |
| **Navegadores Homologados** | Google Chrome 90+, Mozilla Firefox 88+, Safari 14+, MS Edge 90+ | Última versão estável do Google Chrome, Mozilla Firefox ou Safari |
| **Resolução de Tela** | Mínimo de 360px de largura (layout responsivo) | 1366x768px ou superior (resolução Full HD 1920x1080px ideal para gerenciamento administrativo) |
| **Conexão com a Internet**| Banda larga ou rede móvel 3G estável (mínimo de 5 Mbps) | Banda larga estável (Fibra óptica/Wi-Fi) ou 4G/5G (mínimo de 15 Mbps) |

---

> [!TIP]  
> A infraestrutura sugerida na seção de produção prioriza arquitetura Serverless (Vercel) e Banco Relacional como Serviço (Neon/AWS RDS), o que elimina a necessidade de equipe focada em gerenciar servidores físicos e garante o ajuste sob demanda de recursos de hardware.
