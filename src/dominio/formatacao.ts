// Formatação fixa em pt-BR, independente do idioma do aparelho.
// O dinheiro chega sempre em centavos inteiros; a conta é feita sem Intl para não depender dos dados de localidade.

function doisDigitos(numero: number): string {
  return String(numero).padStart(2, '0')
}

// 1234567 → "R$ 12.345,67"
export function formatarReais(centavos: number): string {
  const sinal = centavos < 0 ? '-' : ''
  const absoluto = Math.abs(Math.round(centavos))
  const reais = Math.floor(absoluto / 100)
  const resto = absoluto % 100
  const reaisComMilhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sinal}R$ ${reaisComMilhar},${doisDigitos(resto)}`
}

// "dd/mm/aaaa" no fuso do aparelho.
export function formatarData(data: Date): string {
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`
}

// "dd/mm" no fuso do aparelho.
export function formatarDiaMes(data: Date): string {
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`
}
