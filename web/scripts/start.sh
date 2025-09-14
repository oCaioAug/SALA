#!/bin/sh

echo "🚀 Iniciando aplicação SALA..."

# Aguardar o banco de dados estar pronto
echo "⏳ Aguardando banco de dados..."
until pg_isready -h postgres -p 5432 -U sala_user; do
  echo "Banco não está pronto, aguardando..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

# Aplicar schema no banco
echo "🗄️ Aplicando schema no banco..."
npx prisma db push --accept-data-loss

# Verificar se já existem dados
echo "🔍 Verificando se existem dados..."
ROOM_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Room\";" 2>/dev/null | tail -n 1 | tr -d ' ' || echo "0")

if [ "$ROOM_COUNT" = "0" ]; then
  echo "🌱 Populando banco com dados de exemplo..."
  npm run db:seed
else
  echo "✅ Banco já possui dados, pulando seed."
fi

echo "🎉 Configuração concluída! Iniciando servidor..."
npm run dev
