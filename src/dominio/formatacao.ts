// Formatação fixa em pt-BR, independente do idioma do aparelho.
// O dinheiro chega sempre em centavos inteiros; a conta é feita sem Intl para não depender dos dados de localidade.

function doisDigitos(numero: number): string {
  return String(numero).padStart(2, '0')
}

// 1234567 → "R$ 12.345,67"
export function formatarReais(centavos: number): string {
  const sinal = centavos < 0 ? '-' : ''
  return `${sinal}R$ ${formatarNumeroReais(Math.abs(centavos))}`
}

// 1234567 → "12.345,67", sem o "R$". Usado no campo de valor, que mostra o "R$" à parte.
export function formatarNumeroReais(centavos: number): string {
  const sinal = centavos < 0 ? '-' : ''
  const absoluto = Math.abs(Math.round(centavos))
  const reais = Math.floor(absoluto / 100)
  const resto = absoluto % 100
  const reaisComMilhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sinal}${reaisComMilhar},${doisDigitos(resto)}`
}

// "dd/mm/aaaa" no fuso do aparelho.
export function formatarData(data: Date): string {
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`
}

// "dd/mm" no fuso do aparelho.
export function formatarDiaMes(data: Date): string {
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`
}
