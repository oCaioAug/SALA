# Projeto SALA - Docker Setup

## Como executar o projeto com Docker

### Pré-requisitos
- Docker instalado
- Docker Compose instalado

### Comandos

1. **Construir e executar o projeto:**
   ```bash
   docker-compose up --build
   ```

2. **Executar em background:**
   ```bash
   docker-compose up -d --build
   ```

3. **Parar o projeto:**
   ```bash
   docker-compose down
   ```

4. **Ver logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Reconstruir apenas o container:**
   ```bash
   docker-compose build --no-cache
   ```

### Acesso
- Aplicação: http://localhost:3000

### Vantagens do Docker
- ✅ Ambiente isolado e consistente
- ✅ Sem problemas de compatibilidade de versões
- ✅ Fácil de configurar em qualquer máquina
- ✅ Hot reload funcionando
- ✅ Node.js 18 estável
