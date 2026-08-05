terraform {
  required_version = ">= 1.3.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# 1. Virtual Cloud Network (VCN)
resource "oci_core_vcn" "faccao_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = var.compartment_ocid
  display_name   = "faccao-moreira-vcn"
  dns_label      = "faccaovcn"
}

# 2. Internet Gateway
resource "oci_core_internet_gateway" "faccao_igw" {
  compartment_id = var.compartment_ocid
  display_name   = "faccao-moreira-igw"
  vcn_id         = oci_core_vcn.faccao_vcn.id
}

# 3. Route Table
resource "oci_core_route_table" "faccao_route_table" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.faccao_vcn.id
  display_name   = "faccao-moreira-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.faccao_igw.id
  }
}

# 4. Security List (Firewall Rules: SSH 22, Web 80/443, Updates 3000)
resource "oci_core_security_list" "faccao_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.faccao_vcn.id
  display_name   = "faccao-moreira-security-list"

  # Outbound Rule: Permitir todo tráfego de saída
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  # Inbound Rules: SSH (22), HTTP (80), HTTPS (443), Updates Backend (3000)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "SSH Access"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "Web HTTP"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "Web HTTPS"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "App Update Server API"
    tcp_options {
      min = 3000
      max = 3000
    }
  }
}

# 5. Subnet Pública
resource "oci_core_subnet" "faccao_subnet" {
  cidr_block        = "10.0.1.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.faccao_vcn.id
  display_name      = "faccao-moreira-public-subnet"
  dns_label         = "faccaosubnet"
  security_list_ids = [oci_core_security_list.faccao_security_list.id]
  route_table_id    = oci_core_route_table.faccao_route_table.id
}

# 6. Data Source para encontrar a Imagem Ubuntu 24.04 x86_64 (AMD)
data "oci_core_images" "ubuntu_amd" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = "VM.Standard.E2.1.Micro"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# 7. Data Source para Availability Domain
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

# 8. Instância Always Free VM (AMD E2.1.Micro 1 OCPU / 1GB RAM)
resource "oci_core_instance" "faccao_server" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = var.instance_name
  shape               = "VM.Standard.E2.1.Micro"

  create_vnic_details {
    subnet_id        = oci_core_subnet.faccao_subnet.id
    assign_public_ip = true
    display_name     = "faccao-primary-vnic"
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu_amd.images[0].id
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
  }
}
