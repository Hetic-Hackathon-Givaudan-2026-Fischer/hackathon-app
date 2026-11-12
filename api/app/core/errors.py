"""Erreurs métier : levées par les couches basses, traduites en HTTP par app/api."""


class DatabaseUnavailableError(Exception):
    """PostgreSQL est injoignable."""


class DataSourceUnavailableError(Exception):
    """Une source de données (API Data/IA) est injoignable ou illisible.

    Le message est la cause, pour les logs : jamais de clé d'API dedans.
    """


class NotFoundError(Exception):
    """La ressource demandée n'existe pas (404)."""


class GoneError(Exception):
    """La ressource a existé mais n'est plus servie (410)."""
