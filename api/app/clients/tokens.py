import secrets

# 32 octets aléatoires : 256 bits d'entropie, ~43 caractères en base64 URL
TOKEN_BYTES = 32


class SecretsTokenGenerator:
    """TokenGenerator sur le module `secrets` (générateur cryptographique de l'OS)."""

    def new_token(self) -> str:
        return secrets.token_urlsafe(TOKEN_BYTES)
