import logging

from configuration.settings import configuration

log = logging.getLogger(__name__)


class EmbeddingProvider:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._model = None
        return cls._instance

    @property
    def model(self):
        if self._model is None:
            import torch
            from sentence_transformers import SentenceTransformer

            model_name = configuration.EMBEDDING_MODEL_NAME
            log.info("loading_embedding_model name=%s", model_name)
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self._model = SentenceTransformer(model_name, device=device)
            log.info("embedding_model_ready name=%s device=%s", model_name, device)
        return self._model

    def encode(self, texts: list[str]):
        return self.model.encode(texts)


embedding_provider = EmbeddingProvider()
