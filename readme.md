# SALA - Sistema de Agendamentos de Laboratórios

## Visão Geral do Projeto
O **SALA** (Sistema de Agendamentos de Laboratórios) é uma plataforma desenvolvida para modernizar e otimizar a gestão de laboratórios de informática em instituições de ensino. O projeto visa solucionar os problemas causados pelo agendamento manual, como conflitos de horários, falta de transparência e burocracia, oferecendo uma solução digital completa.

A arquitetura do projeto é híbrida, composta por uma aplicação web para a administração e uma aplicação mobile para os usuários, todas conectadas a um backend unificado.

## Tecnologias Utilizadas
O projeto foi construído utilizando uma stack tecnológica moderna e coesa.

### Backend & Frontend Web (Visão Administrativa)
* **Framework:** Next.js
* **Linguagem:** TypeScript
* **Componentes:** shadcn/ui
* **Banco de Dados:** PostgreSQL

### Frontend Mobile (Visão de Usuário)
* **Framework:** React Native
* **Plataforma:** Expo
* **Linguagem:** TypeScript

## Funcionalidades Principais

### Visão Administrativa (Web)
* Gerenciamento completo de laboratórios (cadastro, edição, remoção).
* Gestão de usuários e permissões.
* Acompanhamento e aprovação/recusa de solicitações de agendamento.
* Visualização de um calendário consolidado de todas as reservas.
* Geração de relatórios de uso e ocupação dos laboratórios.

### Visão de Usuário (Mobile)
* Autenticação segura.
* Consulta em tempo real da disponibilidade dos laboratórios.
* Envio de solicitações de agendamento de forma simplificada.
* Acompanhamento do status de suas reservas.
* Recebimento de notificações sobre aprovações e alterações.

## Estrutura do Projeto
Este repositório segue a estrutura de um **monorepo**, contendo as duas aplicações front-end e o backend em um único local.