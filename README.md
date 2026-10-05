# SMS_Test
SMS_Test
Your site is live at https://carlos-eduardo-1984.github.io/SMS_Test/


# Agenda SMS

Site estático (GitHub Pages) com agenda semanal, clientes, empresa, tipos de serviço e lembretes por SMS pelo app [SMS Gateway for Android](https://github.com/capcom6/android-sms-gateway).

## Publicar
1. Envie `index.html`, `clientes.html`, `empresa.html`, `*.js` e `style.css` para a raiz de um repositório. Inclua também o `server.js`, para o link de download da página Empresa funcionar.
2. **Settings → Pages → Deploy from a branch**, `main` e `/ (root)`.
3. Abra `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Não coloque senhas no repositório: elas são digitadas na página Empresa e ficam só no navegador.

## Usar o SMS
1. No celular: instale o SMS Gateway, ligue o **Local Server** e anote o endereço (IP e porta), o usuário e a senha.
2. Na página **Empresa → Serviço de SMS**, preencha a configuração, salve e copie o comando de início do servidor.
3. No computador (mesma rede do celular), com o Node.js instalado, rode o comando na pasta do `server.js`. Mantenha a janela aberta.
4. Use "Testar conexão com o gateway" e "Enviar mensagem de teste".

O `server.js` só aceita chamadas do site informado em `ORIGIN` e só repassa para endereços da rede local. Se abrir o site por `http://localhost:3000` (com `node server.js` na pasta do projeto), o `ORIGIN` não é necessário.

## Limites
- Os lembretes saem enquanto a agenda estiver aberta no navegador.
- Os dados ficam no `localStorage` do navegador. Limpar os dados do navegador apaga tudo.
- O Chrome pode pedir permissão para acessar a rede local; permita. O Safari costuma bloquear.

