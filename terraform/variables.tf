variable "tenancy_ocid" {
  type        = string
  description = "OCID do seu Tenancy na Oracle Cloud"
}

variable "user_ocid" {
  type        = string
  description = "OCID do seu usuário na Oracle Cloud"
}

variable "fingerprint" {
  type        = string
  description = "Fingerprint da sua API Key da Oracle Cloud"
}

variable "private_key_path" {
  type        = string
  description = "Caminho da chave privada da API Key (.pem)"
}

variable "region" {
  type        = string
  default     = "sa-saopaulo-1"
  description = "Região da Oracle Cloud (ex: sa-saopaulo-1, us-ashburn-1)"
}

variable "compartment_ocid" {
  type        = string
  description = "OCID do Compartimento (pode ser o mesmo do Tenancy)"
}

variable "ssh_public_key_path" {
  type        = string
  default     = "~/.ssh/id_rsa.pub"
  description = "Caminho da chave pública SSH para acessar o servidor Ubuntu"
}

variable "instance_name" {
  type        = string
  default     = "faccao-moreira-server"
  description = "Nome da instância VM"
}
