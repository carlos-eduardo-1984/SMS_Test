No Talend API Tester (extensão do Chrome), isso é um GET simples com autenticação Basic. O endereço muda conforme o modo do app.

1. Pegue as credenciais e o endereço no app

Na aba Home do SMSGate você vê o usuário e a senha.
Modo Local: o app mostra o IP local do aparelho. O computador com o Chrome precisa estar na mesma rede Wi-Fi.
Modo Cloud: não precisa de IP.

2. Configure a requisição no Talend

Método: GET
URL:
Local: http://<IP_DO_CELULAR>:8080/devices
Cloud: https://api.sms-gate.app/3rdparty/v1/devices

3. Adicione a autenticação

No Talend, vá em Headers, clique em Authorization e escolha Basic Auth.
Preencha o usuário e a senha do app.
Como alternativa, crie o header Authorization com o valor Basic seguido de usuario:senha codificado em Base64.

4. Envie e leia a resposta
Clique em Send. A resposta deve ser uma lista de aparelhos, e cada um traz seus SIMs com campos como estes:
## =======================================================
{
  "slotIndex": 1,
  "simNumber": 2,
  "carrierName": "...",
  "phoneNumber": "...",
  "iccid": "..."
}
## =======================================================
Para identificar o eSIM, procure o item cuja carrierName ou cujo iccid corresponde ao perfil do eSIM. O valor de simNumber desse item é o que você coloca no envio da mensagem.

Observações

Campos null: concedem a permissão READ_PHONE_STATE ao app (Informações do app > Permissões). Sem ela, phoneNumber, carrierName e iccid vêm vazios.
Modo Cloud: esses campos aparecem mascarados, só com os últimos 4 caracteres. No modo Local eles vêm completos, então use o Local se precisar identificar o eSIM pelo ICCID.
Confirmar o endereço: não consegui verificar o caminho exato do /devices no modo Local. Abra http://<IP_DO_CELULAR>:8080/docs no navegador, que mostra a documentação Swagger do seu aparelho com os caminhos corretos e permite testar ali mesmo.
Se der erro de conexão ou 401: confira se o servidor local está ligado (botão Offline virou Online), se o IP está certo e se o usuário e a senha foram copiados sem espaços.

Depois de achar o simNumber, teste enviando uma mensagem com ele:

Método: POST
URL: a mesma base, trocando /devices por /message (Local) ou /messages (Cloud)
Body (JSON):
## =======================================================
  {
    "textMessage": { "text": "Teste eSIM" },
    "phoneNumbers": ["+351912345678"],
    "simNumber": 2
  }
## =======================================================

