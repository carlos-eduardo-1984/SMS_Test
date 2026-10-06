# SMS_Test
SMS_Test
Your site is live at https://carlos-eduardo-1984.github.io/SMS_Test/


# Agenda SMS

Site estático (GitHub Pages) com agenda semanal, clientes, empresa, tipos de serviço e lembretes por SMS pelo app [SMS Gateway for Android](https://github.com/capcom6/android-sms-gateway).

## Install and guides
1. DO the GitHub publication as public version

### Using SMS local support
1. Inside an Android device ( >15 version): install the SMSGate apk, turn on the **Local Server**, and do the setup on GitHub page with their (IP e port), o user e a pw.
3. Inside the PC/Laptop (same network as the android device conection),install  Node.js (>14) > `winget install OpenJS.NodeJS.LTS`
4. Run the Powershell command >  `$env:ORIGIN="https://github.com/carlos-eduardo-1984.github.io"; node .\server.js `.
   NOTE: This window should be on hold opened during the work hours..
6. Use "Testar conexão com o gateway" and "Enviar mensagem de teste" to check the stability of sms conections.

O `server.js` just accept the call from `ORIGIN` and just reroute the local network calls. Se abrir o site por `http://localhost:3000` (com `node server.js` na pasta do projeto), o `ORIGIN` não é necessário.

DESATIVAR E REATIVAR PERMISSOES RESTRITIVAS DO APP SMSGATE PARA FUNCIONAR.. .E SOMENTE FUNCIONA COM SIM ...eSim nao é suportado.

## Limites
- Os lembretes saem enquanto a agenda estiver aberta no navegador.
- Os dados ficam no `localStorage` do navegador. Limpar os dados do navegador apaga tudo.
- O Chrome pode pedir permissão para acessar a rede local; permita. O Safari costuma bloquear.

