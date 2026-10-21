from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

Rol = Literal["aprendiz", "instructor", "tecnico", "administrador", "coordinador"]
Prioridad = Literal["baja", "media", "alta"]
EstadoReporte = Literal["pendiente", "en_revision", "resuelto", "cerrado"]


class RegistroUsuario(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    tipo_documento: str = Field(min_length=1, max_length=10)
    documento: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=100)
    apellido: str = Field(min_length=1, max_length=100)
    correo: EmailStr
    contrasena: str = Field(min_length=8, max_length=128)
    rol: Rol = "aprendiz"
    telefono: Optional[str] = Field(default=None, max_length=20)


class LoginUsuario(BaseModel):
    tipo_documento: Optional[str] = Field(default=None, max_length=10)
    documento: Optional[str] = Field(default=None, max_length=30)
    correo: Optional[EmailStr] = None
    contrasena: str = Field(min_length=1, max_length=128)


class CrearReporte(BaseModel):
    id_equipo: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    descripcion: str = Field(min_length=3, max_length=10000)
    prioridad: Prioridad = "media"


class ActualizarEstadoReporte(BaseModel):
    estado: EstadoReporte
    id_usuario: int = Field(gt=0)
    observaciones: Optional[str] = Field(default=None, max_length=2000)


class CrearAmbiente(BaseModel):
    nombre: Optional[str] = Field(default=None, max_length=150)
    descripcion: str = Field(min_length=1, max_length=150)
    id_sede: Optional[int] = Field(default=None, gt=0)
    sede: Optional[str] = Field(default=None, max_length=150)


class ConfirmarEstadoEquipo(BaseModel):
    registro_unico: str = Field(min_length=1, max_length=100)
