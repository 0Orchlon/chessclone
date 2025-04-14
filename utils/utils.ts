// utils.ts

export function getPieceSymbol(piece: { type: string; color: string }) {
    const unicodePieces: Record<string, string> = {
      pw: '♙',
      pb: '♟︎',
      nw: '♘',
      nb: '♞',
      bw: '♗',
      bb: '♝',
      rw: '♖',
      rb: '♜',
      qw: '♕',
      qb: '♛',
      kw: '♔',
      kb: '♚',
    };
  
    return unicodePieces[piece.type + piece.color] || '';
  }
export default getPieceSymbol