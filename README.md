# DriveControl V2 — Uber & 99

## USE ESTA VERSÃO (substitui a V1)

### Recursos
Dashboard gerencial dark premium; jornada com cronômetro; cadastro diário; Uber/99; KM; receitas/despesas; metas; streak 🔥; histórico/CSV; veículo; manutenção; alertas por KM e data; última/próxima troca; custo de manutenção; lucro real estimado.

### Instalação rápida
1. Crie uma planilha Google vazia.
2. Extensões > Apps Script.
3. Cole todo o `Code.gs`.
4. Salve e execute `setup()` uma vez. Autorize.
5. Apps Script > Implantar > Nova implantação > App da Web.
6. Executar como: Eu. Acesso: Qualquer pessoa. Implante e copie a URL `/exec`.
7. Crie um repositório GitHub e envie `index.html`, `style.css` e `app.js`.
8. Settings > Pages > Deploy from a branch > `main` > `/ (root)` > Save.
9. Abra o site > Metas > cole a URL `/exec` > Conectar.
10. Cadastre primeiro o veículo e as manutenções.

### Alertas
- 🟢 OK
- 🟡 Atenção: até 1.000 km ou 30 dias
- 🔴 Vencido: KM/data ultrapassado

### Jornada
Use `▶ Iniciar jornada`; o cronômetro continua mesmo se a página for recarregada. Ao encerrar, início/fim são enviados ao formulário de lançamento.

### Importante
V1 pessoal, sem autenticação multiusuário. Não use como SaaS público sem adicionar autenticação e proteção da API.


## V2.1 Piloto
PWA básico, identificação do motorista, conexão amigável, validações e proteção local contra reenvio duplicado.


## V2.2 – Inteligência do Motorista
- Copiloto financeiro no Dashboard
- Lucro real (despesas + reserva por KM)
- Progresso/falta da meta e previsão por ritmo atual
- Projeção mensal baseada na média dos dias registrados
- Painel inteligente da Jornada
- Alertas visuais de meta, rentabilidade, combustível e manutenção
- Comparação Uber x 99 permanece por receita; não inventa KM por plataforma
- Alertas de desempenho usam histórico próprio quando há pelo menos 3 registros anteriores
