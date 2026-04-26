import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

ASAAS_API_KEY = os.getenv("ASAAS_API_KEY")
ASAAS_API_URL = os.getenv("ASAAS_API_URL", "https://sandbox.asaas.com/api/v3")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

headers = {
    "access_token": ASAAS_API_KEY,
    "Content-Type": "application/json"
}

def create_customer(name, email, cpf_cnpj, phone):
    """Cria um cliente no Asaas"""
    url = f"{ASAAS_API_URL}/customers"
    payload = {
        "name": name,
        "email": email,
        "cpfCnpj": cpf_cnpj,
        "mobilePhone": phone
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            try:
                return response.json().get("id")
            except Exception as e:
                print(f"❌ Erro ao decodificar JSON do Asaas. Resposta bruta: {response.text}")
                return None
        else:
            print(f"❌ Erro Asaas (Status {response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro de conexão com Asaas: {e}")
        return None

def create_subscription(customer_id, plan_type, billing_type="UNDEFINED"):
    """
    Cria uma assinatura (Mensal ou Anual)
    plan_type: 'mensal' ou 'anual'
    billing_type: 'PIX' ou 'CREDIT_CARD' (ou 'UNDEFINED')
    """
    url = f"{ASAAS_API_URL}/subscriptions"
    
    # Valores de exemplo (você pode ajustar conforme desejar)
    value = 97.00 if plan_type == "mensal" else 948.00 # 79 * 12
    cycle = "MONTHLY" if plan_type == "mensal" else "YEARLY"
    
    payload = {
        "customer": customer_id,
        "billingType": billing_type,
        "value": value,
        "nextDueDate": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "cycle": cycle,
        "description": f"Assinatura MedMaster - Plano {plan_type.capitalize()}",
        "postalService": False
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            try:
                data = response.json()
                sub_id = data.get("id")
                
                # O Asaas não retorna invoiceUrl na subscription. Precisamos buscar a 1ª cobrança.
                payment_url = f"{ASAAS_API_URL}/payments?subscription={sub_id}"
                pay_res = requests.get(payment_url, headers=headers)
                
                payment_link = None
                if pay_res.status_code == 200:
                    payments_data = pay_res.json().get("data", [])
                    if payments_data:
                        payment_link = payments_data[0].get("invoiceUrl")
                
                return {
                    "subscription_id": sub_id,
                    "payment_link": payment_link # Agora sim teremos o link!
                }
            except Exception as e:
                print(f"❌ Erro ao decodificar JSON Sub Asaas. Resposta bruta: {response.text}")
                return None
        else:
            print(f"❌ Erro Asaas Sub (Status {response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro de conexão Sub Asaas: {e}")
        return None

def cancel_subscription(subscription_id):
    """
    Cancela uma assinatura existente no Asaas
    """
    url = f"{ASAAS_API_URL}/subscriptions/{subscription_id}"
    
    try:
        response = requests.delete(url, headers=headers)
        if response.status_code == 200:
            return True
        else:
            print(f"❌ Erro ao cancelar assinatura no Asaas (Status {response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão ao tentar cancelar assinatura: {e}")
        return False
