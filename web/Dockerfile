# Use a versão estável do Node.js
FROM node:18-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]
