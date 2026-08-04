output "instance_public_ip" {
  value       = oci_core_instance.faccao_server.public_ip
  description = "IP Público da Máquina Always Free na Oracle Cloud"
}

output "ssh_connection_command" {
  value       = "ssh ubuntu@${oci_core_instance.faccao_server.public_ip}"
  description = "Comando para conectar via SSH no servidor"
}
